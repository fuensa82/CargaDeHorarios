// Includes
var fs = require("fs");
var _ = require("underscore");
var XmlReader = require('xml-reader');
var convert = require('xml-js');


//Rutas de los fichero
var fileHorarios = 'c:\\pruebas\\horarios2.xml';
var xmlAux=fs.readFileSync(fileHorarios,'utf8');
//var xml = XmlReader.parseSync(xmlAux);
var result1 = convert.xml2js(xmlAux, {compact: true, spaces: 4});
//var result2 = convert.xml2js(xmlAux, {compact: false, spaces: 4});
console.log("Transformado");

