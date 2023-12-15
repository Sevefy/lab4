const User = require("./user");
const EventEmitter = require("events");
const currentDate = new Date();
let people;
const express = require("express"); // получаем модуль express
const hbs = require("hbs");
// создаем приложение express
const app = express();
const expressHbs = require("express-handlebars");
// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = express.urlencoded({extended: false});
// устанавливаем обработчик для маршрута "/"

//майскуэль
const mysql = require("mysql2");
let listDocta;
let listRecords;
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "wev",
  password: "admin"
}).promise();
connection.query("SELECT * FROM docta")
  .then(([rows]) =>{
    listDocta = rows;
  })
  .catch(err =>{
    console.log(err);
  });


//Чтобы установить Handlebars в качестве движка представлений в Express, вызывается функция:
// устанавливаем настройки для файлов layout
app.engine("hbs", expressHbs.engine(
  {
      layoutsDir: "views/layouts", 
      defaultLayout: "layout",
      extname: "hbs"
  }
))
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");
app.get("/login", function(_, response){
     
    response.render("logIO",{
      title: "Авторизация",
      textButton: "Войти"
    });
});


app.post("/login",urlencodedParser,function(request,response){
  if(!request.body) return response.sendStatus(400);
  people = new User(request.body.polis);
  //console.log(checkuser(people.getPolis()));
  //console.log(checkuser(people.getPolis()));
  checkuser();
  response.redirect("/menu");
});

app.get("/menu", function(request,response){
  response.render("home",{
    title: "Поликлиника",
    pageinfo: `Ваш полис ${people.getPolis()}`,
    listDocta: listDocta
  });
});

app.post("/menu",urlencodedParser,function(request,response){
  if(!request.body) return response.sendStatus(400);
  console.log(request.body);
  var idD = request.body.docta.slice(0,request.body.docta.indexOf(':'));
  var dates = request.body.date + " " + request.body.time+":00";
  addRec(idD,people.getPolis(),dates,response);
});

function addRec(idD, polis, date,response)
{
  let sql = `INSERT INTO record(idDocta,polis,time) VALUES (${idD},${polis},'${date}')`;
  connection.query(sql)
    .then(result=>{
      console.log(result);
      response.render("home",{
        title: "Поликлиника",
        pageinfo: `Ваш полис ${people.getPolis()}`,
        listDocta: listDocta,
        message: "Вы записаны"
      });
    })
    .catch(err=>{
      console.log(err);
      console.log(date);
      response.render("home",{
        title: "Поликлиника",
        pageinfo: `Ваш полис ${people.getPolis()}`,
        listDocta: listDocta,
        message: "Это время занято"
      });
    });
}

function checkuser()
{
  const sql = `SELECT polis from user where polis = "${people.getPolis()}"`;
  connection.query(sql)
    .then(result=>{
      if(result[0].length == 0){
        console.log("такого пользователя нет");
        insUser();
      }
      else{
        console.log("пользователь зарегистрирован");
      }
    })
    .catch(err=>{
      console.log(err);
    });
}

function insUser()
{
  console.log(people);
  const sql = `INSERT INTO user(polis) VALUES("${people.getPolis()}")`;
  connection.query(sql).then(result =>{
    console.log(result[0]);
  })
  .catch(err =>{
    console.log(err);
  });
}

const fs = require("fs");

function checktimerec()
{
  connection.query("SELECT * FROM record")
  .then(([rows]) =>{
    listRecords = rows;
  })
  .catch(err =>{
    console.log(err);
  });
  if(listRecords != undefined){
    
    for(var i = 0; i<listRecords.length; i++)
    {
      var time = Math.floor((listRecords[i].time - currentDate) / 3600000);
      console.log(time); 
      if( time == 24 || time == 2)
      {
        var docta = "";
        for(var j = 0; j<listDocta.length; j++){
          if(listRecords[i].idDocta == listDocta[j].idD)
            docta = listDocta[j].Name;
        }
        var message = `${listRecords[i].polis} ваша запись к врачу ${docta} через ${time} часа\n`
        fs.appendFile("./log/record.log",message, function(error){
          if(error){  // если ошибка
              return console.log(error);
          }
        });
      }
    }
  }
}
const interval = setInterval(checktimerec,3600000);


// начинаем прослушивание подключений на 3000 порту
app.listen(3005);

















app.listen(3000, function(){ console.log("Сервер начал принимать запросы по адресу http://localhost:3000")});