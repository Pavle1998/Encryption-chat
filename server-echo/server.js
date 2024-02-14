//pribavljamo websoket biblioteku koju koristimo za kreiranje novog servera
const WebSocket = require('ws');

//kreiramo port za server
const PORT=5000;

//pribavlajmo biblioteku za identifikovanje klijenata, dajemo im neki random identifikator
const { v4: uuidv4 } = require('uuid')

//kreiramo webSocket server sa odredjenim portom, lokalno
const wsServer = new WebSocket.Server({
    port:PORT
});

//cuvamo trenutno povezane cliente
const clients = new Map();

//pribavljamo biblioteku za mysql bazupodataka
const mysql = require('mysql2')

//kreiramo MySQL vezu
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database:"ChatDB2"
});

//povezivanje na bazu
connection.connect((error) => {
    if (error) {
        console.error('Error connecting to MySQL database:', error);
    } else {
        console.log('Connected to MySQL database!');
    }
});


//ucitavanje prethodne konverzacije i saljemo klijentima
var vratiKonverzaciju=function(ws){
    let podaci=[];
    let pod;
    connection.query("Select * FROM Messages", function(error, rows, fields){
        if(error){
            console.log("Error in querry!"); 
        }
        else{

            //klijentu vracamo poruku, da li je kriptovana(0 ili 1) i datum poruke
            rows.forEach(el=>{
                pod="";
                pod=pod.concat(el.Message);
                pod=pod.concat(',');
                pod=pod.concat(el.Encrypted);
                pod=pod.concat(',');
                pod=pod.concat(el.Date);
                podaci.push(pod);
            });
        }    
    })

    connection.query("Select * FROM Files", function(error, rows, fields){
        if(error){
            console.log("Error in querry!"); 
        }
        else{
            //klijentu vracamo naziv fajla, velicinu, datum, da li je kriptovana, Type=File
            rows.forEach(el=>{
                pod="";
                pod=pod.concat(el.FileName);
                pod=pod.concat(',');
                pod=pod.concat(el.FileSize);
                pod=pod.concat(',');
                pod=pod.concat(el.Date);
                pod=pod.concat(',');
                pod=pod.concat(el.Encrypted);
                pod=pod.concat(',');
                pod=pod.concat("Type=File");
                podaci.push(pod);
            });

            //sortiramo pribavljene poruke i fajlove i prikazujemo ih redosledu kako su bili poslani
            podaci.sort(function(a,b){
                let aa=a.split(',');
                let bb=b.split(',');
                let c = new Date(aa[2]);
                let d = new Date(bb[2]);
                return c-d;
            });

            podaci.forEach(el=>{
                ws.send(el);
            })
        }    
    });

}

//cuvanje novopristigle poruke u bazu
var snimiPoruku=function(poruka,klijent,kriptovano,datum){
    let vrednostiZaUpis = [[poruka,klijent,kriptovano,datum]];
    connection.query("Insert INTO Messages (Message, Client, Encrypted, Date) VALUES ?",[vrednostiZaUpis],function(error, result){
        if(error){
            console.log("Error in querry snimiPoruku! \n"+ error);
        }
        else{
            console.log("Successuful adding of new text!");
        }    
    });
}

//vrati trazeni fajl
var vratiFajl=function(ws,nazivFajla,size){
    connection.query("Select * FROM Files WHERE FileName = "+nazivFajla + " AND FileSize ="+ size,  function(error, rows, fields){
        if(error){
            console.log("Error in querry!"); 
        }
        else{
            let sadrzaj ;
            rows.forEach(el=>{
                sadrzaj=el.FileText;
            });
            let rez="";
            rez=rez.concat(JSON.parse(nazivFajla));
            rez=rez.concat(",");
            rez=rez.concat(sadrzaj);
            rez=rez.concat(",");
            rez=rez.concat(" ");
            rez=rez.concat(",");
            rez=rez.concat(" ");
            ws.send(rez);
        }    
    });
}

//cuvanje novopristiglog fajla u bazu
var snimiFajl=function(imeFajla,velicinaFajla,sadrzajFajla,klijent,kriptovano,datum){
    let vrednostiZaUpis = [[imeFajla,velicinaFajla,sadrzajFajla,klijent,kriptovano,datum]];
    connection.query("Insert INTO Files (FileName, FileSize, FileText, Client, Encrypted, Date) VALUES ?",[vrednostiZaUpis],function(error, result){
        if(error){
            console.log("Error in querry snimiFajl! \n"+ error);
        }
        else{
            console.log("Successuful adding of new file!");
        }    
    });
}

//pisemo sta ce da se desi kada se klijent poveze na server
//on connection, izvrsi function
//klijent je zapravo socket
//webSocektServer ima mnostvo Sokete koji se na njega povezuju
wsServer.on('connection',function connection(ws, request, socket) {
    
    //svakom pridoslom clientu kreiramo id kao neki rendom preko uuidv4 i vezujemo ga za njega
    const clientId = uuidv4();
    clients.set(ws,clientId);

    //ispisi da se neko prikljucio
    console.log("A new client just connected: " + clientId);

    //ucitaj stare poruke novokonektovanom klijentu
    wsServer.clients.forEach(function each(client) {
        if (client == ws) { //ovde hocemo da posaljemo istoriju poruka samo novokonektovanom klijentu, a ne svima koji su vec povezani
            vratiKonverzaciju(ws);
        }
    });

    //kad klijent(socket) posalje poruku,uradi nesto
    //kao argument dobija poruku klijenta
    //jer pozivom fje socket.on(messagge...) prosledjuje se poruka klijenta, kao msg, tj kao atribut fje
    //kako je kao string, parsiramo je 
    ws.on("message",function(data){
        let primljeno = JSON.parse(data);
        primljeno = primljeno.split(','); // ako je poruka [0]=poruka [1]=nekriptovano(0),kriptovano(1)
                                          // ako je fajl imeFajla,velicinaFajla,sadrzajFajla,kriptovano,datum
        //server obavestava od koga je sta primio i da li je kriptovana ili ne
        if(primljeno.length==3){//stigla poruka
            console.log(clients.get(ws)+ ": " + JSON.parse(primljeno[0]) + " Kriptovano: "+ primljeno[1] + " Type: message");
            //novopristiglu poruku od klijenta salji u bazu
            snimiPoruku(JSON.parse(primljeno[0]),clients.get(ws),primljeno[1],JSON.parse(primljeno[2]));

            //hocemo da svim prisutnim klijentima posaljemo poruku od nekog klijenta
            //pristupimo svim klijentima na wsServeru (oni su kao niz pa mozemo sa forEach da ih obidjemo) i svakom damo fju koja salje poruku
            //osim naravno onom ko salje poruku, da se ne duplira(jer poruka se ispise kad on posalje, ne treba da se ispise i kad mu je server vrati)
            wsServer.clients.forEach(function each(client) {
                if (client !== ws) {
                    let zaSlanje="";
                    zaSlanje=zaSlanje.concat(JSON.parse(primljeno[0])+','+primljeno[1]);
                    client.send(zaSlanje);
                }
            });
        }
        else if(primljeno.length==4){//zahtev za fajlom
            console.log(clients.get(ws)+ " wants to downlaod a file: " + JSON.parse(primljeno[0])+ "\nSize: "+ primljeno[1] + "\nUploaded: "+ JSON.parse(primljeno[2])+ "\nKriptovano: "+ primljeno[3] );
            vratiFajl(ws,primljeno[0],primljeno[1]);    //nalazimo trazeni fajl i saljemo ga klijentu
        }
        else{//stigao fajl
            console.log(clients.get(ws)+ ": " + JSON.parse(primljeno[0]) + " Kriptovano: "+ primljeno[3] + " Type: File" );
            //novopristiglu poruku od klijenta salji u bazu
            snimiFajl(JSON.parse(primljeno[0]),primljeno[1],JSON.parse(primljeno[2]),clients.get(ws),primljeno[3],JSON.parse(primljeno[4]));
            
            //hocemo da svim prisutnim klijentima posaljemo poruku od nekog klijenta
            //pristupimo svim klijentima na wsServeru (oni su kao niz pa mozemo sa forEach da ih obidjemo) i svakom damo fju koja salje poruku
            //osim naravno onom ko salje poruku, da se ne duplira(jer poruka se ispise kad on posalje, ne treba da se ispise i kad mu je server vrati)
            wsServer.clients.forEach(function each(client) {
                if (client !== ws) {
                    let zaSlanje="";

                    zaSlanje=zaSlanje.concat(JSON.parse(primljeno[0]));
                    zaSlanje=zaSlanje.concat(',');
                    zaSlanje=zaSlanje.concat(primljeno[1]);
                    zaSlanje=zaSlanje.concat(',');
                    zaSlanje=zaSlanje.concat(JSON.parse(primljeno[4]));
                    zaSlanje=zaSlanje.concat(',');
                    zaSlanje=zaSlanje.concat(primljeno[3]); 
                    zaSlanje=zaSlanje.concat(',');
                    zaSlanje=zaSlanje.concat("Type=File");

                    client.send(zaSlanje);
                }
            });
        }
    });
    
    wsServer.on('close',function(ws){
        console.log("A client just disconected");
    })
});

console.log((new Date()) + " Server is listening on port: " + PORT );