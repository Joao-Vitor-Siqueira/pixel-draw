//html elements
const canvas = [...document.querySelectorAll("canvas")].reverse();

const layerSelectors = [...document.getElementsByClassName("layerSelector")].reverse();
const visibilityBtns = [...document.getElementsByClassName("layerBtn")].reverse();

const colorMenuBtn = document.getElementById("colorMenuBtn");
const colorMenu = document.getElementById("colorMenu");
const colorSelectors = [...document.getElementsByClassName("colorMenu")[0].children];

const toolMenuBtn = document.getElementById("toolMenuBtn");
const toolMenu = document.getElementById("toolMenu");
const toolSelectors = [...document.getElementsByClassName("toolMenu")[0].children];

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const configMenuBtn = document.getElementById("configMenuBtn");
const configMenu = document.getElementById("configMenu");
const strokeSizeSelect = document.getElementById("strokeSize");
const showGridBtn = document.getElementById("showGrid");

const gridFilter = document.getElementById("gridFilter");


//logic ----------------------------------------------------------------------------------------------------------------
let currentDialog = null;

const colors = [
    "#ff0000",	
    "#ff4000",	
    "#ff8000",	
    "#ffbf00",	
    "#ffff00",	
    "#bfff00",	
    "#80ff00",	
    "#40ff00",	
    "#00ff00",		
    "#00ff80",	
    "#00ffbf",	
    "#00ffff",	
    "#00bfff",	
    "#0080ff",	
    "#0040ff",	
    "#0000ff",	
    "#4000ff",	
    "#8000ff",	
    "#bf00ff",	
    "#ff00ff",	
    "#ff00bf",	
    "#ff0080",	
    "#ffffff",
    "#000000"
]

let selectedLayer = 0;
let ctx = canvas.map(canvasScreen => canvasScreen.getContext("2d"));

let selectedColor = "#000000";
let selectedColorRGBA = new Uint8Array([0,0,0,255]);

let selectedTool = "pen";
let strokeSize = 10;

let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;

let canvasWidth;
let canvasHeight;

//state management for each layer
let undoArr = [[],[],[]];
let redoArr = [[],[],[]];
let overrideState = [false,false,false];
let rollBackCount = [0,0,0];
let ctrlKeyPress = false;



//menu events-----------------------------------------------------------------------------------------------------------------

colorMenuBtn.addEventListener('click', () => {   //dialog display handling
    if(colorMenu.open) {
        colorMenu.close();
        currentDialog = null;
    }
    else {
        colorMenu.show();
        if(currentDialog != null) currentDialog.close();
        currentDialog = colorMenu;
    }  
})

toolMenuBtn.addEventListener('click', () => {   //dialog display handling
    if(toolMenu.open) {
        toolMenu.close();
        currentDialog = null;
    }
    else {
        toolMenu.show();
        if(currentDialog != null) currentDialog.close();
        currentDialog = toolMenu;
    }   
})

configMenuBtn.addEventListener('click', () => {   //dialog display handling
    if(configMenu.open) {
        configMenu.close();
        currentDialog = null;
    }
    else {
        configMenu.show();
        if(currentDialog != null) currentDialog.close();
        currentDialog = configMenu;
    }  
})

colorSelectors.forEach((element,index) => {  
    element.style.backgroundColor = colors[index];
    element.addEventListener('click',() => {
        selectedColor = colors[index];
        selectedColorRGBA[0] = hexToDecimal(selectedColor.substring(1,3));
        selectedColorRGBA[1]  = hexToDecimal(selectedColor.substring(3,5));
        selectedColorRGBA[2]  = hexToDecimal(selectedColor.substring(5,7));

        
        colorMenuBtn.style.backgroundColor = colors[index];
        colorMenu.close();
        currentDialog = null;
    })
})

toolSelectors.forEach((element) => {  
    element.addEventListener('click',() => {
        selectedTool = element.id;
        [...toolMenuBtn.children][0].src = `../assets/svg/${selectedTool}.svg`;
        toolMenu.close();
        currentDialog = null;
    })
})

undoBtn.addEventListener('click',() => undo());

redoBtn.addEventListener('click',() => redo());

layerSelectors.forEach((layer,index) => {   
    layer.addEventListener('click', () => {
        if(index != selectedLayer){
            
            selectedLayer = index;
            layer.style.opacity = 1;
            layer.style.border = "6px solid lightgreen";
            
            layerSelectors.forEach((item,pos) => {
                if(pos != index) {  //not selected layers
                    item.style.opacity = 0.5;
                    item.style.border = "2px solid black";
                }
            })
        }
    })
})

visibilityBtns.forEach((item,index) => {   
    item.addEventListener('click',() => {
        if(item.src.includes("Off")){
            item.src = `../assets/svg/eye.svg`;
            canvas[index].style.display = "block";
        }
        else{
            item.src = `../assets/svg/eyeOff.svg`;
            canvas[index].style.display = "none";
        }
    })
})

strokeSizeSelect.addEventListener('change', () => {
    strokeSize = strokeSizeSelect.value;
})
showGridBtn.addEventListener('change', () => {
    gridFilter.classList.toggle('hidden');
})


// canvas events --------------------------------------------------------------------------------------------------------

canvas.forEach((layer => {
    layer.addEventListener('mousedown', (e) => {
        
        if(overrideState[selectedLayer]){
            while(rollBackCount[selectedLayer] > 0){
                redoArr[selectedLayer].pop();
                rollBackCount[selectedLayer] --;
            }
            overrideState[selectedLayer] = false;
        }
        
        undoArr[selectedLayer].push(ctx[selectedLayer].getImageData(0,0,canvasWidth,canvasHeight));
        ctx[selectedLayer].beginPath()
        paint(e.clientX,e.clientY);
        isMouseDown = true;
        
        e.stopPropagation();
    })
}))


document.addEventListener('mousemove',(e) => {
    if(isMouseDown){
        paint(e.clientX,e.clientY);
    } 
    
    let pos = canvas[selectedLayer].getBoundingClientRect();
    //check if out of bounds
    if(e.clientY < pos.top || e.clientY > pos.bottom || e.clientX < pos.left || e.clientX > pos.right){
        isMouseDown = false;
    }       
})

document.addEventListener('mouseup', () => { isMouseDown = false });

document.addEventListener('keydown',(e) => {
    if(e.key === 'Control'){
        ctrlKeyPress = true;
    }
})

document.addEventListener('keyup',(e) => {
    if(e.key === 'Control'){
        ctrlKeyPress = false;
    }
})


//shortcuts -------------------------------------------------------------------------------------------------------------
document.addEventListener('keydown',(e) => {   
    if(e.key === 'z' && ctrlKeyPress) undo();
})

document.addEventListener('keydown',(e) => {   
    if(e.key === 'y' && ctrlKeyPress) redo();
})

document.addEventListener('keydown', (e) => {  
    if(e.key === 'p'){
        
        selectedTool = selectedTool !== "pen"? "pen" : "pencil";

        [...toolMenuBtn.children][0].src = `../assets/svg/${selectedTool}.svg`;
        toolMenu.close();
        currentDialog = null;
    }
})

document.addEventListener('keydown', (e) => {
    if(e.key === 'g'){
        selectedTool = "fill";
        [...toolMenuBtn.children][0].src = `../assets/svg/${selectedTool}.svg`;
        toolMenu.close();
        currentDialog = null;
    }
})

document.addEventListener('keydown', (e) => {
    if(e.key === 'e'){
        selectedTool = "eraser";
        [...toolMenuBtn.children][0].src = `../assets/svg/${selectedTool}.svg`;
        toolMenu.close();
        currentDialog = null;
    }
})



//-----------------------------------------------------------------------------------------------------------------------



function paint(x,y){

    ctx[selectedLayer].strokeStyle = selectedColor;
    ctx[selectedLayer].lineWidth = strokeSize;

    switch (selectedTool) {
        case "pencil": 
            ctx[selectedLayer].lineCap = 'square';
            break;
        case "pen":
            ctx[selectedLayer].lineCap = 'round';
            break;
        case "eraser":
            //check if pixel is transparent
            if(ctx[selectedLayer].getImageData(x,y,1,1).data.every(num => num == 0)) 
                return;            
            ctx[selectedLayer].strokeStyle = '#ffffff';
            break;  
        case "fill":
            let arr32 = new Uint32Array(selectedColorRGBA.buffer);
            floodFill(x,y, ...arr32);
            return;
    }

    ctx[selectedLayer].lineTo(x,y);
    ctx[selectedLayer].stroke();
}

function getPixel(pixelData, x, y) {
    if (x < 0 || y < 0 || x >= pixelData.width || y >= pixelData.height) {
      return -1; 
    } else {
      return pixelData.data[y * pixelData.width + x];
    }
  }
  
function floodFill(x, y, fillColor) {
    const imageData = ctx[selectedLayer].getImageData(0, 0, canvasWidth, canvasHeight);
  
    const pixelData = {
      width: imageData.width,
      height: imageData.height,
      data: new Uint32Array(imageData.data.buffer),
    };

    const targetColor = getPixel(pixelData, x, y); 
    
    if (targetColor !== fillColor) {
  
      const pixelsToCheck = [x, y];
      while (pixelsToCheck.length > 0) {
        const y = pixelsToCheck.pop();
        const x = pixelsToCheck.pop();
  
        const currentColor = getPixel(pixelData, x, y);
        if (currentColor === targetColor) {
          pixelData.data[y * pixelData.width + x] = fillColor;
          pixelsToCheck.push(x + 1, y);
          pixelsToCheck.push(x - 1, y);
          pixelsToCheck.push(x, y + 1);
          pixelsToCheck.push(x, y - 1);
        }
      }
  
  
      ctx[selectedLayer].putImageData(imageData, 0, 0);
    }
  }

function hexToDecimal(hex){
    let desc = 0;
    for (let i = 0; i < hex.length; i++) {
        let val;
        switch (hex[i]) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                val = Number(hex[i]);
                break;
            case 'a':
                val = 10;
                break;
            case 'b':
                val = 11; 
                break; 
            case 'c':
                val = 12;
                break;    
            case 'd':
                val = 13;
                break;
            case 'e':
                val = 14;
                break;
            case 'f':
                val = 15;
                break;              
        }  
        desc += val * (16 ** (hex.length - 1 - i));
    }
    return desc;
}

function initCanvas(width,height){

    canvas.forEach(layer => {
        
        let layerCtx = layer.getContext("2d");
        layerCtx.canvas.width = width;
        layerCtx.canvas.height = height;
        
    })
        
    gridFilter.style.width = `${width}px`;
    gridFilter.style.height = `${height}px`;

    canvasWidth = width;
    canvasHeight = height;
}

function undo(){   
    
    overrideState[selectedLayer] = true;
    let imageData = undoArr[selectedLayer].pop();
    
    if(imageData){            
        rollBackCount[selectedLayer] ++;
        redoArr[selectedLayer].push(ctx[selectedLayer].getImageData(0,0,canvasWidth,canvasHeight));
        ctx[selectedLayer].putImageData(imageData,0,0);
    }   
}

function redo(){
  
    let imageData = redoArr[selectedLayer].pop();
    
    if(imageData){
        rollBackCount[selectedLayer] --;
        undoArr[selectedLayer].push(ctx[selectedLayer].getImageData(0,0,canvasWidth,canvasHeight));
        ctx[selectedLayer].putImageData(imageData,0,0);
    }
    
}

initCanvas(1920,953)

