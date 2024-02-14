window.onload=function(){
   const serverAddres="ws://127.0.0.1:5000"; //adresa servera

   //kreiramo webSocket, klijenta i povezujemo ga na server
   const ws = new WebSocket(serverAddres);

   let dugme = document.querySelector(".send-button");
   let typingBox = document.querySelector(".typing-box");
   
   //dugme.addEventListener("click",posaljiPoruku);  //da se poruka salje na dugme send
   dugme.addEventListener("click",()=>{
      posaljiPoruku();
      if(document.querySelector(".inputFile").value!=""){
         posaljiFajl(ws);
         document.querySelector(".inputFile").value=null;//ocisti input element
         obrisiFajloveZaSlanje();
      }
   })

   typingBox.addEventListener("keypress",function(event){   //da se poruka salje na enter
      if(event.key==="Enter"){
         posaljiPoruku();

         if(document.querySelector(".inputFile").value!=""){
            posaljiFajl(ws);
            document.querySelector(".inputFile").value=null;   //ocisti input element
            obrisiFajloveZaSlanje();
         }
      }
   });

   //kad klikne On za enkripciju enkriptuje ono sto je dekriptovano
   let rbtnEnkripcijaOn = document.querySelector(".rbtnOn");
   rbtnEnkripcijaOn.addEventListener("click",onFunkcija);

   //kad klikne Off za enkripciju, dekriptuje ono sto moze da se dekriptuje
   let rbtnEnkripcijaOff = document.querySelector(".rbtnOff");
   rbtnEnkripcijaOff.addEventListener("click", offFunkcija);

   function  posaljiPoruku(){
      let poruka = JSON.stringify(typingBox.value);

      if((typingBox.value).trim().length!==0){  //proverimo da nije samo spejs ili samo spejsovi, tako sto skinemo sve spejsove sa pocetka i kraja i vidimo jel duzina 0

         typingBox.value="";

         let zaSlanje="";
         //ako kljuc nije podesen, ako kljuc nije duzine 25 ili je los kljuc, salji nekriptovano  
         if((document.querySelector(".kljucInput").value=="" || !(/^[a-zA-Z]+$/.test(document.querySelector(".kljucInput").value)) ||
            (document.querySelector(".kljucInput").value.length>25) || (document.querySelector(".kljucInput").value.length<25) ||
            !isUniqueString(document.querySelector(".kljucInput").value) || document.querySelector(".period").value<=0) || document.querySelector("input[type='radio']:checked").value==1)
         {
            //ws.send(JSON.stringify(poruka));
            zaSlanje=zaSlanje.concat(poruka);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(0);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(getDateTime()));
            ws.send(JSON.stringify(zaSlanje));

            //crtanje na ekranu onog ko salje nekriptovanu poruku
            zaSlanje="";
            zaSlanje=zaSlanje.concat(JSON.parse(poruka));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(0);
            crtajPoruku(zaSlanje);
         }
         else{
            let enkriptovanaPoruka=enkripcija(poruka);
            zaSlanje=zaSlanje.concat(enkriptovanaPoruka);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(1);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(getDateTime()));
            ws.send(JSON.stringify(zaSlanje));

            //crtanje na ekranu onog ko salje kriptovanu poruku
            zaSlanje="";
            zaSlanje=zaSlanje.concat(JSON.parse(enkriptovanaPoruka));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(1);
            crtajPoruku(zaSlanje);
         }

      }
   }

   ws.onmessage = function(event){
      let podatak = event.data.split(',');

      if(podatak.includes("Type=File")){//rec je o fajlu za crtanje u chat
         crtajFajl(ws,event.data);
      }
      else if(podatak.length==4){//rec je o fajlu za preuzimanje
         if(document.querySelector("input[type='radio']:checked").value==1){  //skidamo dekriptovan fajl
            const link = document.createElement("a");
            const content = dekripcija(podatak[1]);
            const file = new Blob([content], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);
            link.download = dekripcija(podatak[0]);
            if(!link.download.includes(".txt")){
               link.download=link.download.concat(".txt");
            }
            link.click();
            URL.revokeObjectURL(link.href);
         }
         else{ //skdiamo kriptovan fajl
            const link = document.createElement("a");
            const content = podatak[1];
            const file = new Blob([content], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);
            link.download = podatak[0];
            if(!link.download.includes(".txt")){
               link.download=link.download.concat(".txt");
            }
            link.click();
            URL.revokeObjectURL(link.href);
         }
      }
      else{//rec je o poruci
         crtajPoruku(event.data);
         if(document.querySelector("input[type='radio']:checked").value==1){
            offFunkcija();
         }
         else{
            onFunkcija();
         }
      }
     
   }
   
}

function posaljiFajl(ws){
   let inputFile=document.querySelector(".inputFile");

   var fileName = inputFile.files[0].name;
   var fileSize = inputFile.files[0].size;

   //ucitavamo fajl
   const reader = new FileReader();

   reader.addEventListener(
      "load",
      () => {
        // this will then display a text file
        //console.log(reader.result);
        let zaSlanje="";
         //ako kljuc nije podesen, ako kljuc nije duzine 25 ili je los kljuc, salji nekriptovano  
         if((document.querySelector(".kljucInput").value=="" || !(/^[a-zA-Z]+$/.test(document.querySelector(".kljucInput").value)) ||
            (document.querySelector(".kljucInput").value.length>25) || (document.querySelector(".kljucInput").value.length<25) ||
            !isUniqueString(document.querySelector(".kljucInput").value) || document.querySelector(".period").value<=0) || document.querySelector("input[type='radio']:checked").value==1)
         {
            zaSlanje=zaSlanje.concat(JSON.stringify(fileName));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(fileSize);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(reader.result));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(0);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(getDateTime()));
            ws.send(JSON.stringify(zaSlanje)); 

            //crtanje na ekranu onog ko salje nekriptovanu poruku
            zaSlanje="";
            zaSlanje=zaSlanje.concat(fileName);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(fileSize);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(getDateTime()));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(0);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat("Type=File");
            crtajFajl(ws,zaSlanje);
         }
         else{
            let enkriptovanNazivFajla=enkripcija(JSON.stringify(fileName));
            let enkriptovanSadrzajFajla=enkripcija(JSON.stringify(reader.result));
            zaSlanje=zaSlanje.concat(enkriptovanNazivFajla);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(fileSize);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(enkriptovanSadrzajFajla);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(1);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(getDateTime()));
            ws.send(JSON.stringify(zaSlanje)); 

            //crtanje na ekranu onog ko salje kriptovanu poruku
            zaSlanje="";
            zaSlanje=zaSlanje.concat(JSON.parse(enkriptovanNazivFajla));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(fileSize);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(JSON.stringify(getDateTime()));
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat(1);
            zaSlanje=zaSlanje.concat(',');
            zaSlanje=zaSlanje.concat("Type=File");
            crtajFajl(ws,zaSlanje);
         }
      },
      false,
    );
  
    if (inputFile.files[0]) {
      reader.readAsText(inputFile.files[0]);
    }
}

//brisanje fajlova nakon klika na dugme send
function obrisiFajloveZaSlanje(){
   let fajlovi = document.querySelectorAll(".selektovanFajlDiv");
   if(fajlovi.length!=0){
      fajlovi.forEach(el=>{
         document.querySelector(".selektovanFajl").removeChild(el);
      })
   }
}

//broji koliko reci ima u stringu
function WordCount(str) { 
   return str.split(" ").length; //dobijemo niz rezi, i uzmemo njegovu duzinu i dobijemo broj reci
}

//****ENKRIPCIJA Bifid Cipher****
function enkripcija(poruka){
   //sve prevedi u loweCase, zadrzavamo samo reci i space, SVAKO j zamenimo sa i, zameni vise razmaka samo za jedan
   let pocetnaPoruka=poruka.toLowerCase().replace(/[0-9]/g, '').replace(/[^\w\s]/gi, '').replace(/\s+/gi, '');
   //pocetnaPoruka=pocetnaPoruka.
   let ovoZameni=document.querySelector(".replaceInput").value;
   let saOvim=document.querySelector(".withThisInput").value;
   pocetnaPoruka=pocetnaPoruka.replaceAll(ovoZameni,saOvim);
   console.log(pocetnaPoruka);
   console.log(pocetnaPoruka.length);

   //splituj poruku tamo gde je sa obe strane spejsa rec, da izbegne ako npr na kraju imamo paja___ , pa da ne razdvoji na paja, _
   //let brojReci=pocetnaPoruka.split(/(?<=\S)\s(?=\S)/).length;
   let nizReci=pocetnaPoruka.split(/(?<=\S)\s(?=\S)/);

   let kljuc=document.querySelector(".kljucInput").value;
   kljuc=kljuc.split('');
   
   let keySquare=[];
   let ki=0;   //krece se kroz kljuc, tj kljucInput.value
   let kn;  //5 elementa iz kljuca koji se dodaju u keySquare
   for ( let i=0; i<5; i++){
      kn=[];
      for(let j=0; j<5; j++){
         kn.push(kljuc[ki]);
         ki++;
      }
      keySquare.push(kn);
   }
   

   //step 1
   //ovde cuvamo redove u kojima se nalaze slova, niz nizova    
   let nizRedova=[];
   //ovde cuvamo kolone u kojima se nalaze slova
   let nizColona=[];
   let info;
   nizReci.forEach((rec,ind)=>{
      let recRed="";
      let recCol="";
      rec.split('').forEach((char) => {
         info=nadjiRedIKol(keySquare,char);
         recRed=recRed.concat(info[0]);   
         recCol=recCol.concat(info[1]);
      });
      nizRedova[ind]=recRed;
      nizColona[ind]=recCol;
   });

   //step 2
   //spojimo sve nizove unutar nizRedova
   let pomocniNizRed="";
   nizRedova.forEach(el=>{
      pomocniNizRed=pomocniNizRed.concat(el);
   })
   //spojimo sve nizove unutar nizColona
   let pomocniNizCol="";
   nizColona.forEach(el=>{
      pomocniNizCol=pomocniNizCol.concat(el);
   })

   //tako spojene nizove, sada grupisemo u grupe od po 5 ili manje
   //preuzimamo period, automatski je 5
   let period=parseInt(document.querySelector(".period").value)
   
   nizRedova=[];
   let index = 0;
   while (index < pomocniNizRed.length) {
      nizRedova.push(pomocniNizRed.substring(index, Math.min(index + period,pomocniNizRed.length)));
      index += period;
   }
   
   //tako spojene nizove, sada grupisemo u grupe od po 5 ili manje
   nizColona=[];
   index = 0;
   while (index < pomocniNizCol.length) {
      nizColona.push(pomocniNizCol.substring(index, Math.min(index + period,pomocniNizCol.length)));
      index += period;
   }


   //step3
   //spajamo nizColona i nizRedova u jedan niz podnizova
   let nizColonaIRedove="";
   nizRedova.forEach((el,ind)=>{
      nizColonaIRedove=nizColonaIRedove.concat(el.concat(nizColona[ind]));
   })

   let izlaznaPoruka="";
   index=0;
   while(index<(nizColonaIRedove.length)-1){

      izlaznaPoruka=izlaznaPoruka.concat(keySquare[nizColonaIRedove[index]-1][nizColonaIRedove[index+1]-1]);
      index+=2;
   }

   return JSON.stringify(izlaznaPoruka);
}

//****DEKRIPCIJA Bifid Cipher****
function dekripcija(kriptovanaPoruka)
{
   //kreiramo keySquare na osnovu unetog kljuca, ako je los, nece lepo da se dekodira :D
   let kljuc=document.querySelector(".kljucInput").value;
   kljuc=kljuc.split('');

   let keySquare=[];
   let ki=0;
   let kn;
   for ( let i=0; i<5; i++){
      kn=[];
      for(let j=0; j<5; j++){
         kn.push(kljuc[ki]);
         ki++;
      }
      keySquare.push(kn);
   }
   //pribavimo period
   let period=parseInt(document.querySelector(".period").value)

   //proverimo jel kriptovan tekst sadrzi neko slovo koje mi nemamo u nasoj keySquare matrici
   //ako ima, zamenimo ga sa slovom za zamenu
   let ovoZameni=document.querySelector(".replaceInput").value;
   let saOvim=document.querySelector(".withThisInput").value;
   kriptovanaPoruka=kriptovanaPoruka.replaceAll(ovoZameni,saOvim);
   

   //step3 , idemo od nazad sad 
      //kriptovanu poruku izdelimo u grupe duzine Periode, ili manje ako nema vise slovaa
      let grupeSlova=[];
         let index = 0;
         while (index < kriptovanaPoruka.length) {
            grupeSlova.push(kriptovanaPoruka.substring(index, Math.min(index + period, kriptovanaPoruka.length)));
            index += period;
      }

      //pronadjemo za te grupice slova gde se koji nalazi u keySquare-u  ikreiramo niz pod nizova tipa string
      let grupeRedovaIKolona=[];
      let redICol;
      grupeSlova.forEach(grupa=>{
            redICol="";
            grupa.split('').forEach(char=>{
               let charRedICol=nadjiRedIKol(keySquare,char);
               redICol=redICol.concat(charRedICol[0]);
               redICol=redICol.concat(charRedICol[1]);
            });
            grupeRedovaIKolona.push(redICol);
      })
      

   //step2
   //kreiramo nizRedova i nizKolona
   let nizRedova=[];
   let nizKolona=[];
   let podGrupaRed;
   let podGrupaKol;
   let duzina;
   grupeRedovaIKolona.forEach(grupa=>{
      podGrupaRed="";
      podGrupaKol="";
      duzina=grupa.length;
      podGrupaRed=grupa.substring(0,duzina/2);
      podGrupaKol=grupa.substring(duzina/2,duzina);

      nizRedova.push(podGrupaRed);
      nizKolona.push(podGrupaKol);
   })


   //plaintext
   let dekriptovanaPoruka="";
   let keySquareRed;
   let keySquareKol;
   nizRedova.forEach((grupaRed,ind)=>{
      for(let i=0;i<grupaRed.length; i++){
         keySquareRed=nizRedova[ind][i];
         keySquareKol=nizKolona[ind][i];
         dekriptovanaPoruka=dekriptovanaPoruka.concat(keySquare[keySquareRed-1][keySquareKol-1]);
      }
   })
   
   return dekriptovanaPoruka;
}

//proveravmo da li se svi karakter u kljucu nalaze samo jednom
function isUniqueString (str) {
	for (let i = 0; i < str.length; i++) {
		if (str.indexOf(str[i]) !== i) return false;
	}
	return true;
}

function crtajPoruku(poruka){
   let odServera=poruka.split(','); //stize nam <poruka>,<kriptovana ili ne>

   let host = document.querySelector(".message-area");

   let div1 = document.createElement("div");
   div1.classList.add("message-box");
   div1.classList.add("others-message-box");
   host.appendChild(div1);

   let div11 = document.createElement("div");
   div11.classList.add("message");
   div11.classList.add("others-message");
   div11.classList.add(odServera[1]);
   div11.innerHTML=odServera[0];
   host.appendChild(div11);

   let div12 = document.createElement("div");
   div12.classList.add("separator");
   host.appendChild(div12);

   //skroluj na dno chata
   let messageArea= document.querySelector(".message-area");
   messageArea.scrollTo(0, messageArea.scrollHeight);
}

function crtajFajl(ws,imeFajlaIKriptovanost){
   let imeIKriptovanost=imeFajlaIKriptovanost.split(','); //stize nam naziv fajla, velicinu, datum , da li je kriptovana, Type=File

   let host = document.querySelector(".message-area");

   let div1 = document.createElement("div");
   div1.classList.add("message-box");
   div1.classList.add("others-message-box");
   host.appendChild(div1);

   let div11 = document.createElement("div");
   div11.classList.add("message");
   div11.classList.add("others-message");
   div11.classList.add("tip-fajl");
   div11.classList.add(imeIKriptovanost[1]);
   div11.id=imeIKriptovanost[2];
   div11.classList.add(imeIKriptovanost[3]);
   div11.innerHTML=imeIKriptovanost[0];
   div11.value=imeIKriptovanost[0];
   div1.appendChild(div11);

   /*let div22 = document.createElement("div");
   div22.classList.add("message");
   div22.classList.add("others-message");
   div22.classList.add("div22");
   div1.appendChild(div22);

   let slicicaDownload = document.createElement("img");
   slicicaDownload.src="../Resursi/downloadImg.png";
   slicicaDownload.classList.add("slicicaDownload");
   slicicaDownload.style.width="20px";
   slicicaDownload.style.height="20px";
   //slicicaDownload.style.paddingLeft="10px";
   div22.appendChild(slicicaDownload);*/

   div11.addEventListener("click",()=>{
      let p="";
      p=p.concat(JSON.stringify(imeIKriptovanost[0]));
      p=p.concat(",");
      p=p.concat(imeIKriptovanost[1]);
      p=p.concat(",");
      p=p.concat(JSON.stringify(imeIKriptovanost[2]));
      p=p.concat(",");
      p=p.concat(imeIKriptovanost[3]);
      ws.send(JSON.stringify(p));
   })

   let div12 = document.createElement("div");
   div12.classList.add("separator");
   host.appendChild(div12);

   //skroluj na dno chata
   let messageArea= document.querySelector(".message-area");
   messageArea.scrollTo(0, messageArea.scrollHeight);
}

function nadjiRedIKol(keySquare,slovo){
   let pom=[];
   let nadjeno=false;
   for(let i =0; i<5; i++){
      for(let j=0; j<5; j++){
         if(keySquare[i][j]==slovo){
            pom.push(i+1);
            pom.push(j+1);
            nadjeno=true;
            break;
         }
      }
      if(nadjeno==true){
         break;
      }
   }
   return pom;
}

function offFunkcija(ws){
   if(document.querySelector(".kljucInput").value!="" && document.querySelector(".period").value>0){
      let ucitanePoruke=document.querySelectorAll(".others-message");   //dohvati sve poruke
      ucitanePoruke.forEach(poruka=>{  //unutar svih poruka nadji one koje su kriptovane
         if(poruka.classList[2]=="1" && !poruka.classList.contains("izmenjena")){ //kriptovane su ako imaju 1 u classListi, to im dodamo kad stignu od servera  
            poruka.innerHTML=dekripcija(poruka.innerHTML);
            poruka.classList.add("izmenjena");  //dodamo im jos jednu klasu, tako da ih ne dekriptuje svaki put kad kliknemo
         }
      })

      let ucitaniFajlovi=document.querySelectorAll(".tip-fajl");   //dohvati sve fajlove
      ucitaniFajlovi.forEach(fajl=>{  //unutar svih fajlova nadji one koje su kriptovani
         if(fajl.classList[4]=="1" && !fajl.classList.contains("izmenjena")){ //kriptovane su ako imaju 1 u classListi, to im dodamo kad stignu od servera  
            fajl.innerHTML=dekripcija(fajl.value);

            fajl.classList.add("izmenjena");  //dodamo im jos jednu klasu, tako da ih ne dekriptuje svaki put kad kliknemo

         }
      })
   }
}

function onFunkcija(){
   let ucitanePoruke=document.querySelectorAll(".others-message");   //dohvati sve poruke
   ucitanePoruke.forEach(poruka=>{  //unutar svih poruka nadji one koje su kriptovane, pa dekriptovane
      if(poruka.classList[2]=="1" && poruka.classList.contains("izmenjena")){ //kriptovane pa dekriptovane su ako imaju 1 u classListi i izmenjena  
         poruka.innerHTML=JSON.parse(enkripcija(poruka.innerHTML));
         poruka.classList.remove("izmenjena");  //dodamo im jos jednu klasu, tako da ih ne dekriptuje svaki put kad kliknemo
      }
   })

   let ucitaniFajlovi=document.querySelectorAll(".tip-fajl");   //dohvati sve fajlove
   ucitaniFajlovi.forEach(fajl=>{  //unutar svih fajlova nadji one koje su kriptovani, pa dekriptovani
      if(fajl.classList[4]=="1" && fajl.classList.contains("izmenjena")){ //kriptovane pa dekriptovane su ako imaju 1 u classListi i izmenjena  
         fajl.innerHTML=JSON.parse(enkripcija(fajl.value));

         fajl.classList.remove("izmenjena");  //dodamo im jos jednu klasu, tako da ih ne dekriptuje svaki put kad kliknemo
      }
   })
}

function getDateTime() {
   var now     = new Date(); 
   var year    = now.getFullYear();
   var month   = now.getMonth()+1; 
   var day     = now.getDate();
   var hour    = now.getHours();
   var minute  = now.getMinutes();
   var second  = now.getSeconds(); 
   if(month.toString().length == 1) {
        month = '0'+month;
   }
   if(day.toString().length == 1) {
        day = '0'+day;
   }   
   if(hour.toString().length == 1) {
        hour = '0'+hour;
   }
   if(minute.toString().length == 1) {
        minute = '0'+minute;
   }
   if(second.toString().length == 1) {
        second = '0'+second;
   }   
   var dateTime = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;   
    return dateTime;
}