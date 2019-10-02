// Includes
var fs = require("fs");
var _ = require("underscore");
var XmlReader = require('xml-reader');
var convert = require('xml-js');
var mysql = require('mysql');

//Conector base de datos
var connection;


//Rutas de los fichero
var fileHorarios = 'c:\\pruebas\\horarios.xml';
var xmlAux=fs.readFileSync(fileHorarios,'utf8');

var result1 = convert.xml2js(xmlAux, {compact: true, spaces: 4});
//objeto profesores: result1.timetable.teachers.teacher[x]
console.log("Transformado");
var profesores=new Array();
for (var i=0;i<result1.timetable.teachers.teacher.length;i++){
    guardarProfesor(result1.timetable.teachers.teacher[i],profesores);
}
var lessons=new Array();
for (var i=0;i<result1.timetable.lessons.lesson.length;i++){
    guardarLesson(result1.timetable.lessons.lesson[i],lessons);
}
var periodos=new Array();
for (var i=0;i<result1.timetable.periods.period.length;i++){
    guardarPeriodos(result1.timetable.periods.period[i],periodos);
}

guardarHorarios(profesores,lessons,periodos,result1.timetable.cards.card);
// lessons   result1.timetable.lessons.lesson[0]._attributes.teacherids
// cards     result1.timetable.cards.card[0]._attributes
console.log("tratado");

/**
 * 
 * @param {*} profesores 
 * @param {*} lessons 
 * @param {*} periodo 
 * @param {*} fichas 
 */
function guardarHorarios(profesores,lessons,periodos,fichas){
    this.lessons=lessons;
    this.profesores=profesores;
    this.periodos=periodos;
    fichas.forEach(element => {
        var idProfesor=lessons[element._attributes.lessonid];
        console.log(profesores[lessons[element._attributes.lessonid].profesor]);
    });
}


/**
 * Hace la lista con los periodos que vienen en el xml
 * @param {*} periodo 
 * @param {*} periodos 
 */
function guardarPeriodos(periodo, periodos){
    periodos[periodo._attributes.short]={horaIni:periodo._attributes.starttime,horaFin:periodo._attributes.endtime};
}

/**
 * Guarda una lesson en la lista de lessons, el indice de la lista es el id de la lesson y lo que contiene es el id del
 * profesor que la imparte.
 * @param {lesson que vamos a guardar en la lista} lesson 
 * @param {Lista donde se guardaran los datos, solo estará el ID del profesor que imparte la clase(lesson)} lessons 
 */
function guardarLesson(lesson, lessons){
    lessons[lesson._attributes.id]={
        profesor:lesson._attributes.teacherids
    };
}

/**
 * Este método guarda al profesor en la lista y también lo da de alta en la base de datos si no existe ya.
 * @param {Datos del profesor que vienen en el XML pero ya transformados a JSON} profesor 
 * @param {Lista donde se quiere guardar} profesores 
 */
function guardarProfesor(profesor,profesores){
    profesores[profesor._attributes.id]={
        nombreCorto:profesor._attributes.short,
        nombre:profesor._attributes.name
    };
    guardarEnBDsinoExiste(profesores[profesor._attributes.id]);
}

/**
 * 
 * @param {objeto json con el profesor que queremos comprobar si existe o no
 * si no existe en la base de datos se llamará a la funcion para darlo de alta} profesor 
 */
function guardarEnBDsinoExiste(profesor){
    conectar();
    var sql="select * from profesores where nombreCorto='"+profesor.nombreCorto+"'";
    connection.query(sql,function(error, result, fields){
        if(result.length==0){
            console.log("Se va a guardar "+profesor);
            guardarProfesorBD(profesor);
        }else{
            console.log("Ya estaba guardado "+profesor);
        }
    });
    desconectar();
}

function guardarProfesorBD(profesor){
    conectar();
    var sql="INSERT INTO profesores (nombreCorto,nombre) values ('"+profesor.nombreCorto+"','"+profesor.nombre+"')";
    //var sql="INSERT INTO profesores (nombreCorto,nombre) values ('aaa','Juan')";
    connection.query(sql,function(error, result, fields){
        if(error==null){
            console.log("Guardando");
        }
    });
    desconectar();
}

function conectar(){
    connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'Hijo34Luna',
        database : 'colsan'
    });
    connection.connect();
}
function desconectar(){
    connection.end();
}

