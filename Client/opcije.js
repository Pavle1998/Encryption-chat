let opcijeDiv = document.querySelector(".opcije");
let enkripcijaDiv=document.querySelector(".enkripcija");


//crtamo deo za enkripciju
let nizOpcija=["On","Off"];
let btn;
let rbtl;
nizOpcija.forEach((el,ind)=>{

    btn=document.createElement("input");
    btn.type="radio";
    btn.name="opcija";
    btn.classList.add("rbtn");
    btn.value=ind;
    if(ind==0){
        btn.classList.add("rbtnOn");
    }
    else{
        btn.classList.add("rbtnOff");
    }
    enkripcijaDiv.appendChild(btn);

    rbtl=document.createElement("label");
    rbtl.classList.add("rbtnlabel");
    rbtl.innerHTML=el;
    enkripcijaDiv.appendChild(rbtl);

    //da bi jedan bio uvek chekiran
    //inicijalno je ukljucena enkripcija
    if(ind==0){
        btn.checked=true;
    }
});


//crtamo deo za kljuc
let kljucDiv=document.querySelector(".kljuc");
let kljucInput = document.createElement("input");
kljucInput.classList.add("kljucInput");
kljucInput.value="phqgmeaylnofdxkrcvszwbuti";
kljucInput.maxLength=25;
kljucDiv.appendChild(kljucInput);

//crtamo deo za period
let periodDiv=document.querySelector(".periodDiv");
let periodInput = document.createElement("input");
periodInput.classList.add("period");
periodInput.value="5";
periodInput.type="number";
periodDiv.appendChild(periodInput);

//crtamo deo za replace this
let replaceThis=document.querySelector(".replaceThis");
let replaceThisInput = document.createElement("input");
replaceThisInput.classList.add("replaceInput");
replaceThisInput.value="j";
replaceThisInput.type="char";
replaceThis.appendChild(replaceThisInput);

//crtamo deo za replace with
let withThis=document.querySelector(".withThis");
let withThisInput = document.createElement("input");
withThisInput.classList.add("withThisInput");
withThisInput.value="i";
withThisInput.type="char";
withThis.appendChild(withThisInput);