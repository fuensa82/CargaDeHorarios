// Includes
var fs = require("fs");
var _ = require("underscore");
var XmlReader = require('xml-reader');
var convert = require('xml-js');
var mysql = require('mysql');
var mysqlSync = require('sync-mysql');
const { exit } = require("process");

var ficheroBarra="c:\\Fichajes\\barra.dat";
var ficharoPrueba="c:\\Fichajes\\pruebaArg.txt";
//Conector base de datos
var connection;
var connectionSync;
var barra=1;

var fileHorarios, curso, tipoHora;
var profesores,lessons,periodos;

fs.writeFile(ficheroBarra,barra,(err,pos)=>{
    var promise1=new Promise(function(resolve, reject) {
        for(var i=0;process.argv.length>i;i++){
            fs.appendFile(ficharoPrueba,"Linea "+i+": "+ process.argv[i]+"\n",(err)=>{
                if(i==process.argv.length){
                    resolve();
                }
            });
        }
    });
    promise1.then(()=>{
        //Rutas de los fichero
        fileHorarios = process.argv[2];
        curso = process.argv[3];
        tipoHora=process.argv[4];
        if(fileHorarios==undefined){
            fileHorarios = "C:\\Fichajes\\Primaria 21-22.xml";
            curso="2020-2021";
            tipoHora="L";
        }
        fs.readFile(fileHorarios,'utf8',(err,xmlAux)=>{
            var result1 = convert.xml2js(xmlAux, {compact: true, spaces: 4});
            //objeto profesores: result1.timetable.teachers.teacher[x]
            console.log("Transformado");
            console.log("barra: "+barra);
            fs.writeFileSync(ficheroBarra,barra);
            profesores=new Array();
            lessons=new Array();
            periodos=new Array();

            var promise = new Promise(function(resolve, reject) {
                var promesasProfesor=[];
                if(result1.timetable.teachers.teacher.length!=undefined){
                    for (var i=0;i<result1.timetable.teachers.teacher.length;i++){
                        promesasProfesor.push(guardarProfesor(result1.timetable.teachers.teacher[i],profesores));
                    }
                }else{
                    promesasProfesor.push(guardarProfesor(result1.timetable.teachers.teacher,profesores));
                }
                Promise.all(promesasProfesor).then(function(){
                    if(result1.timetable.lessons.lesson.length!=undefined){
                        for (var i=0;i<result1.timetable.lessons.lesson.length;i++){
                            guardarLesson(result1.timetable.lessons.lesson[i],lessons);
                        }
                    }else{
                        guardarLesson(result1.timetable.lessons.lesson,lessons);
                    }
                    if(result1.timetable.periods.period.length!=undefined){
                        for (var i=0;i<result1.timetable.periods.period.length;i++){
                            guardarPeriodos(result1.timetable.periods.period[i],periodos);
                        }
                    }else{
                        guardarPeriodos(result1.timetable.periods.period,periodos);
                    }
                    resolve();
                });
            });


            promise.then(function(){
                console.log("fin de la promesa")
                barra+=4;
                console.log("barra: "+barra);
                fs.writeFileSync(ficheroBarra,barra);
                console.log("tipoHora: "+tipoHora);
                guardarHorarios(profesores,lessons,periodos,result1.timetable.cards.card, tipoHora).then(function(){
                    console.log("FIN");
                    fs.writeFileSync(ficheroBarra,"FIN");
                    exit(0);
                });
                
            });

            // lessons   result1.timetable.lessons.lesson[0]._attributes.teacherids
            // cards     result1.timetable.cards.card[0]._attributes
            
        });

        
    });

});
/**
 * 
 * @param {*} profesores 
 * @param {*} lessons 
 * @param {*} periodo 
 * @param {*} fichas 
 */
function guardarHorarios(profesores,lessons,periodos,fichas, tipoHora){
    console.log("Empezamos a guardar horarios+tipoHora "+tipoHora);
    this.lessons=lessons;
    this.profesores=profesores;
    this.periodos=periodos;
    this.tipoHora=tipoHora;
    var promise = new Promise(function(resolve, reject) {
        var arrayPromesas=[];
        fichas.forEach(card => {
            barra+=1/(fichas.length/95);
            console.log("barra: "+(""+barra).split(".")[0]);
            fs.writeFileSync(ficheroBarra,(""+barra).split(".")[0]);
            if(lessons[card._attributes.lessonid].profesor[0].length>1){
                var arrayProfesores=lessons[card._attributes.lessonid].profesor;
                for(var i=0;arrayProfesores.length>i;i++){
                    var profesor=profesores[arrayProfesores[i]];
                    var horas=periodos[card._attributes.period];
                    var dia=getDia(card._attributes.days);
                    arrayPromesas.push(guardarFicha(profesor,horas,dia, curso, tipoHora));
                }
                console.log("");
            }else{
                var profesor=profesores[lessons[card._attributes.lessonid].profesor];
                
                var horas=periodos[card._attributes.period];
                var dia=getDia(card._attributes.days);
                if(profesor!=undefined){
                    arrayPromesas.push(guardarFicha(profesor,horas,dia,curso, tipoHora));
                }else{
                    //card.lessonid;
                    console.log("Ficha que no tiene profesor asignado: ");
                    console.log(card._attributes.lessonid);
                    console.log(card._attributes.classroomids);
                }
            }
        });
        Promise.all(arrayPromesas).then(function(){
            resolve();
        })
    });

    return promise;
}

function guardarFicha(profesor,horas,dia, curso, tipoHora){
    console.log("GuardarFicha tipoHora"+tipoHora);
    this.profesor=profesor;
    this.horas=horas;
    this.dia=dia;
    this.tipoHora=tipoHora;
    //console.log("guardarFicha");
    var promise = new Promise(function(resolve, reject) {
        if(profesor.nombreCorto==undefined){
            console.log("Ficha que no tiene profesor asignado");
            resolve();
        }else{
            var con=conectar();
            var sql="select idProfesor from profesores where nombreCorto='"+profesor.nombreCorto+"'";
            var result=con.query(sql,(err, result)=>{
                guardarFichaBD(result[0].idProfesor,horas,dia, curso, tipoHora).then(function(){
                    resolve();
                });
            });
        }
    });
    return promise;
}


function guardarFichaBD(idProfesor,horas, dia, curso, tipoHora){
    console.log("GuardarFichaBD tipoHora="+tipoHora);
    var promise = new Promise(function(resolve, reject) {
        var con=conectar();
        var sql="INSERT INTO horarios (horaIni, horaFin, dia, idProfesor, curso, tipoHora) values ('"+horas.horaIni+"','"+horas.horaFin+"','"+dia+"','"+idProfesor+"','"+curso+"','"+tipoHora+"')";
        con.query(sql,(err)=>{
            con.commit();
            resolve();
        });
    });
    return promise;
    //desconectar();
}

/**
 * Genera la letra correspondiente al día de la semana que se la pasa en el 
 * formato binario del XML
 * @param {Cadena del xml para los días, que vienen como 10000, 01000, ...} cadena 
 */
function getDia(cadena){
    if(cadena=="10000"){
        return "L";
    }else if(cadena=="01000"){
        return "M";
    }else if(cadena=="00100"){
        return "X";
    }else if(cadena=="00010"){
        return "J";
    }else if(cadena=="00001"){
        return "V";
    }else{
        return "N";
    }
}
/**
 * Hace la lista con los periodos que vienen en el xml
 * @param {*} periodo 
 * @param {*} periodos 
 */
function guardarPeriodos(periodo, periodos){
    periodos[periodo._attributes.period]={horaIni:periodo._attributes.starttime,horaFin:periodo._attributes.endtime};
}

/**
 * Guarda una lesson en la lista de lessons, el indice de la lista es el id de la lesson y lo que contiene es el id del
 * profesor que la imparte.
 * @param {lesson que vamos a guardar en la lista} lesson 
 * @param {Lista donde se guardaran los datos, solo estará el ID del profesor que imparte la clase(lesson)} lessons 
 */
function guardarLesson(lesson, lessons){
    var profesores=lesson._attributes.teacherids.split(",");
    if(profesores.length>1){
        console.log("Muchos profesores");
        lessons[lesson._attributes.id]={profesor:profesores};
    }else{
        lessons[lesson._attributes.id]={
            profesor:lesson._attributes.teacherids
        };
    }
}

/**
 * Este método guarda al profesor en la lista y también lo da de alta en la base de datos si no existe ya.
 * @param {Datos del profesor que vienen en el XML pero ya transformados a JSON} profesor 
 * @param {Lista donde se quiere guardar} profesores 
 */
function guardarProfesor(profesor,profesores){
    var promise = new Promise(function(resolve, reject) {
        profesores[profesor._attributes.id]={
            nombreCorto:profesor._attributes.short,
            nombre:profesor._attributes.name
        };
        guardarEnBDsinoExiste(profesores[profesor._attributes.id]).then(function(){
            resolve();
        });
    });
    return promise;
}

/**
 * 
 * @param {objeto json con el profesor que queremos comprobar si existe o no
 * si no existe en la base de datos se llamará a la funcion para darlo de alta} profesor 
 */
function guardarEnBDsinoExiste(profesor){
    var promise = new Promise(function(resolve, reject) {
        var con=conectar();
        
        var sql="select * from profesores where nombreCorto='"+profesor.nombreCorto+"'";
        var result=con.query(sql,(error, result, fields)=>{
            if(result.length==0){
                guardarProfesorBD(profesor).then(function(){
                    resolve();
                });
            }else{
                console.log("Ya estaba guardado "+profesor);
                resolve();
            }
        });
    });
    return promise;
    
}

function guardarProfesorBD(profesor){
    var promise = new Promise(function(resolve, reject) {
        var con=conectar();
        var sql="INSERT INTO profesores (nombreCorto,nombre) values ('"+profesor.nombreCorto+"','"+profesor.nombre+"')";
        con.query(sql,(err)=>{
            con.commit(function(err) {
                console.log("Commit");
                if(err)console.log("Error: "+err);
                resolve();
            });
        });
    });
    return promise;
    
}

function conectar(){
    if(connection==undefined){
        connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : '03885536',
            database : 'colsan',
            connectTimeout: 60000
        });
        /*connection.connect((err)=>{
            console.log("error: "+err);
        });*/
    }
    
    return connection;
}

function conectarSync(){
    if(connectionSync==undefined){
        connectionSync = new mysqlSync({
            host     : 'localhost',
            user     : 'root',
            password : '03885536',
            database : 'colsan',
            connectTimeout: 60000
        });
    }
}
function desconectar(){
    connection.end();
}

