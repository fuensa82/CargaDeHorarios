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
console.log("tratado");



/**
 * Este método guarda al profesor en la lista y también lo da de alta en la base de datos si no existe ya.
 * @param {Datos del profesor que vienen en el XML pero ya transformados a JSON} profesor 
 * @param {Lista donde se quiere guardar} profesores 
 */
function guardarProfesor(profesor,profesores){
    guardarEnBDsinoExiste(profesor);
    profesores[profesor._attributes.id]={
        nombreCorto:profesor._attributes.short,
        nombre:profesor._attributes.name
    };
}


function guardarEnBDsinoExiste(profesor){
    conectar();
    connection.query("select * from profesores",function(error, result, fields){
        console.log("leyendo");
    })
    desconectar();
}

function conectar(){
    connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'colsan',
        password : 'ColSan2019',
        database : 'colsan'
    });
    connection.connect();
}
function desconectar(){
    connection.end();
}

