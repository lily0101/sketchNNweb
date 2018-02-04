/*
* show the following immediate
*/

window.onload=function(){
  //onload在页面或者图片加载完成之后立即执行
  //canvas
    var canvas=document.getElementById('canvas');
    if(!canvas){
      console.log("Failed to retrieve the <canvas> element ");
      return;
    }
    var ctx=canvas.getContext('2d');
    //画一个白色矩形
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,800,400);
    //按下标记
    var onoff=false;
    var oldx=0;
    var oldy=0;
    //设置颜色默认为黑色
    var linecolor="black";
    //宽度默认为4
    var linw=1;

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
    canvas.addEventListener("mousemove",draw,true);//边捕获边绘画
    canvas.addEventListener("mousedown",down,false);
    canvas.addEventListener("mouseup",up,false);
    
    /*
    *the function when mouse is down
    */
    function down(event){
      onoff=true;
      oldx=event.pageX-canvas.offsetLeft;
      console.log("canvas's offsetLeft:"+canvas.offsetLeft)
      // event.pageX指的是鼠标相对于屏幕的坐标，要想求得鼠标在canvas画布中的坐标
      //，那就需要求出canvas相对于整个屏幕的坐标（这里canvas画布是从原点开始的）
      oldy=event.pageY-canvas.offsetTop;
      }
    
    /*
    *the function when mouse is up
    * finish the drawing
    */
    function up(){
      onoff=false;
      }

    /*
    *the function drawing when the mouse is down
    */
    function draw(event){
      //边拖边绘画，需要改为指定起点，终点，然后画一条直线吗？
      if(onoff==true)
        {
        var newx=event.pageX-canvas.offsetLeft;
        var newy=event.pageY-canvas.offsetTop;
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

/*
* functions below excute when the button is click
*/

/*
* show the canvas in browser
*/
function change(){
   document.getElementById("image").src=canvas.toDataURL("image/jpg");
  }


/*
*change to blob and send to server，that is called by exportCanvaAsPng
*
*/
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

/*
*change to blob and send to server，that is called by exportCanvaAsPng
*change the canvas to blob and send to server using ajax
*/
function postCanvas(filename) {
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
}

/*
*using the time as the name of image
*/
function recordData(){
    var time = new Date();  
    // 程序计时的月从0开始取值后+1  
    var m = time.getMonth() + 1;  
    var day = time.getFullYear() + "_" + m + "_"+ time.getDate();  
    var t = time.getHours() + "_"+ time.getMinutes() + "_" + time.getSeconds(); 
    var filename = day +"_"+ t
    //send image to server
    postCanvas(filename);
    /*
    postMeasurement()
    */
}

/*
*loop save pictures when click the button
*/
var i = 0;
var id = 0;
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

/*clean the canvas
* just use one new canvas cover it 
*/
function clean(){
   var canvas=document.getElementById('canvas');
   var ctx = canvas.getContext('2d')
   ctx.fillStyle="#fff";
   ctx.fillRect(0,0,800,400);
}
 
