//var need to be saved
//direction
var direction = 0.0

window.onload=function(){
  //onload在页面或者图片加载完成之后立即执行
  //canvas
    var canvas=document.getElementById('canvas');
    if(!canvas){
      console.log("Failed to retrieve the <canvas> element ");
      return;
    }
    var ctx=canvas.getContext('2d');
    //画一个黑色矩形
    ctx.fillStyle="#002200";
    ctx.fillRect(0,0,800,800);
    //按下标记
    var onoff=false;
    //start point
    var oldx=-10;
    var oldy=-10;
    //end point
    var endx=-10
    var endy=-10
    
    //设置颜色默认为白色
    var linecolor="white";
    //宽度默认为4
    var linw=4;

    //size
    var huabi=document.getElementById("sel");
    huabi.onchange=function(){
    linw=huabi.value;
    };
    //color
    var color=document.getElementById("color");
    color.onchange=function(){
    linecolor=color.value;
    };

    //鼠标移动事件，事件绑定
   // canvas.addEventListener("mousemove",draw,true);//边捕获边绘画
    canvas.addEventListener("mousedown",down,false);
    canvas.addEventListener("mouseup",up,true);

    function down(event){
      onoff=true;
      oldx=event.pageX-10;
      // event.pageX指的是鼠标相对于屏幕的坐标，要想求得鼠标在canvas画布中的坐标
      //，那就需要求出canvas相对于整个屏幕的坐标（这里canvas画布是从原点开始的）
      oldy=event.pageY-10;
      }

    function up(event){
      draw(event)
      }

    function draw(event){//边拖边绘画，需要改为指定起点，终点，然后画一条直线吗？
      if(onoff==true)
        {
        var newx=event.pageX-10;
        var newy=event.pageY-10;
        endx = newx
        endy = newy
        var dx = endx-oldx
        var dy = endy-oldy
        /*
        if(dx == 0 || dy == 0){
          //notice: direction = 0?
          direction = abs(dx) > abs(dy) ? dx:dy
        }
        else{
          direction = dy/dx
        }
        */
        ctx.beginPath();
        ctx.moveTo(oldx,oldy);
        ctx.lineTo(newx,newy);
        ctx.strokeStyle=linecolor;
        ctx.lineWidth=linw;
        ctx.lineCap="round";
        ctx.stroke();
        
        oldx=newx;
        oldy=newy;
        }
      }
};


//show image
function change(){
   document.getElementById("image").src=canvas.toDataURL("image/jpg");
  //window.open("demo.htm", "height=100px, width=400px");
  //alert(document.getElementById("image"));
  }


//record image
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

function exportCanvasAsPNG(filename) {
    var canvas=document.getElementById('canvas');

    var MIME_TYPE = "image/png";

    var dataurl = canvas.toDataURL('image/png');
    var blob = dataURLtoBlob(dataurl);
//使用ajax发送
    var fd = new FormData();
    fd.append("image", blob, filename+".png");
    console.log(fd)
    $.ajax({
      url:"/drawing",
      type:"POST",
      data:fd,
      processData: false, // 不会将 data 参数序列化字符串
      contentType: false, // 根据表单 input 提交的数据使用其默认的 contentType
      success:function(msg){  
        // alert('Done,Picture Uploaded')  //get success id
      }
    })
    //设置标签为这样的标签，直接在前端进行下载
    /*
    var dlLink = document.createElement('a');
   
    dlLink.download = filename;
    dlLink.href = imgURL;
    dlLink.dataset.downloadurl = ['image/png', dlLink.download, dlLink.href].join(':');
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
    */
}


function recordData(){
      //record time for image name
    var time = new Date();  
    // 程序计时的月从0开始取值后+1  
    var m = time.getMonth() + 1;  
    var day = time.getFullYear() + "_" + m + "_"+ time.getDate();  
    var t = time.getHours() + "_"+ time.getMinutes() + "_" + time.getSeconds(); 
    var filename = day +"_"+ t
    exportCanvasAsPNG(filename);
  //  writeToFile(filename,direction);
  //record the label of canvas

}
var i = 0;
var id = 0;
//var fso=new ActiveXObject(Scripting.FileSystemObject); 
//var fileObject=fso.createtextfile("F:/graduateStudy/lab/drawing robot/毕设/simulator/mouseDrawing/demo/data/direction.txt",2,true);
//loop save pictures
function record(){
  console.log("button times:",i)
  if(i % 2 == 0)
  {
    id = setInterval(function() {
    recordData();
    }, 1000);
     console.log("setInterval id:",id)
  }
  else
  {
     console.log("clearTnterval id:",id)
     clearInterval(id)
  }
    
   i++;
}

function clean(){
  //clean the canvas
   var canvas=document.getElementById('canvas');
   var ctx = canvas.getContext('2d')
   ctx.fillStyle="#002200";
   ctx.fillRect(0,0,800,800);
}
//finally close the file
//fileObject.close();
  
