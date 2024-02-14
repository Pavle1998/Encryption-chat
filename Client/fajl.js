let chooseFile = document.querySelector(".chooseFile");
let inputFile = document.querySelector(".inputFile");
inputFile.value=null;//kad se kreira input element vrednost mu je null

let file;
var filename;

chooseFile.onclick = () => {
    inputFile.click();
};

inputFile.addEventListener("change", function (e) {
    var fileName = e.target.files[0].name;
    var filePath = URL.createObjectURL(e.target.files[0]);

    //hvatamo div za crtanje selektovanog fajla
    let selektovanFajl=document.querySelector(".selektovanFajl");
        //crtamo div za selektovan fajl
        let selektovanFajlDiv = document.createElement("div");
        selektovanFajlDiv.classList.add("selektovanFajlDiv");
        selektovanFajl.appendChild(selektovanFajlDiv);
            //crtamo nazif fajla i dugme za brisanje fajla
            let selektovanFajlIme=document.createElement("div");
            selektovanFajlIme.classList.add("selektovanFajlIme");
            selektovanFajlIme.innerHTML=fileName;
            selektovanFajlDiv.appendChild(selektovanFajlIme);

            let selektovanFajlObrisi=document.createElement("div");
            selektovanFajlObrisi.classList.add("selektovanFajlObrisi");
            selektovanFajlObrisi.innerHTML="X";
            selektovanFajlObrisi.id=filePath;
            selektovanFajlObrisi.addEventListener("click",function(){
                selektovanFajl.removeChild(selektovanFajlDiv);
            });
            selektovanFajlDiv.appendChild(selektovanFajlObrisi);
});
