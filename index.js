// Includes
var fs = require("fs");
var _ = require("underscore");
var XmlReader = require('xml-reader');
var convert = require('xml-js');
var mysql = require('mysql');

//Conector base de datos
var connection;


//Rutas de los fichero
var fileHorarios = 'c:\\pruebas\\horarios2.xml';
var xmlAux=fs.readFileSync(fileHorarios,'utf8');

var result1 = convert.xml2js(xmlAux, {compact: true, spaces: 4});
//objeto profesores: result1.timetable.teachers.teacher[x]
console.log("Transformado");
var profesores=new Array();
for (var i=0;i<result1.timetable.teachers.teacher.length;i++){
    guardarProfesor(result1.timetable.teachers.teacher[i],profesores);

}
console.log("tratado");



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

