/*
* using the p5.js library 
*/
var color_list = ['red','blue','yellow','black','green']
var size_list = ['1','2','4','8','16']
var model_list = ['flower',
    'dog',
    'test',
    'airplane'];
var scoreMessage = ["小朋友，还需继续努力哦！！",
"画的还不错呢！已经超过了60%的小伙伴了哦！",
"你真棒！你的绘画能力很不错哦！",
"perfect! 你已经完全掌握了绘画技能哦！"
]
// variables we need for this demo
var dx, dy; // offsets of the pen strokes, in pixels
var pen = 0;
var prev_pen = 1;
var x, y; // absolute coordinates on the screen of where the pen is，鼠标的绝对坐标
var start_x, start_y;

var startTime,endTime,delayTime;

var has_started = false; // set to true after user starts writing.
var just_finished_line = false;
var epsilon = 2.0; // to ignore data from user's pen staying in one spot.
var line_color = "red";
var line_width = 3.0;

var screen_width, screen_height; // stores the browser's dimensions
var insize_x,insize_y;

var raw_lines = [];
var current_raw_line =[];
var current_raw_line_simple=[];
var strokes, raw_strokes;
var stroke, raw_stroke;
var last_point, idx;
var stroke;

var last_point, idx;

var line_color;

//dom
var submit_button;
var teach_button;
var draw_button;
var color_sel;
var size_sel;
var model_sel;
var teach_canvas;
var draw_canvas;
var message;

//teach
var teacher_strokes = [];
var fps_number = 0;
var teach_x,teach_y;
var teach_start;
var teach_gate = false;
var teach_prev_pen =[1,0,0];

//learn
var learn_gate = false;
var tips = "";

var teach = function(p){
  "use strict";
  //get the strokes
  var getCookie = function(c_name) { 
  　if (document.cookie.length>0){　　//先查询cookie是否为空，为空就return ""
　　　　　　var c_start=document.cookie.indexOf(c_name + "=")　　//通过String对象的indexOf()来检查这个cookie是否存在，不存在就为 -1　　
　　　　　　if (c_start!=-1){ 
　　　　　　　　c_start=c_start + c_name.length+1　　//最后这个+1其实就是表示"="号啦，这样就获取到了cookie值的开始位置
　　　　　　　　var c_end=document.cookie.indexOf(";",c_start)　　//其实我刚看见indexOf()第二个参数的时候猛然有点晕，后来想起来表示指定的开始索引的位置...这句是为了得到值的结束位置。因为需要考虑是否是最后一项，所以通过";"号是否存在来判断
　　　　　　　　if (c_end==-1) c_end=document.cookie.length　　
　　　　　　　　return unescape(document.cookie.substring(c_start,c_end))　　//通过substring()得到了值。想了解unescape()得先知道escape()是做什么的，都是很重要的基础，想了解的可以搜索下，在文章结尾处也会进行讲解cookie编码细节
　　　　　　} 
　　　　}
　　　　return ""
  };

  var draw_example_teach = function(example, start_x, start_y, line_color, line_thickness) {
    var i;
    var x=start_x, y=start_y;
    var dx,dy;
    var pen_down, pen_up, pen_end;
    var prev_pen = [1, 0, 0];   //start 
    var the_line_thickness = 1.0;
    console.log(start_x,start_y);
    if (typeof line_thickness === "number") {
      the_line_thickness = line_thickness;
    } 
    for(i=0;i<example.length;i++) {
      // sample the next pen's states from our probability distribution
      [dx, dy, pen_down, pen_up, pen_end] = example[i];

      if (prev_pen[2] == 1) { // end of drawing.[0,0,1]
        break;
      }

      // only draw on the paper if the pen is touching the paper
      if (prev_pen[0] == 1) {
        p.stroke(line_color);
        p.strokeWeight(line_width);
        p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
      }

      // update the absolute coordinates from the offsets
      x += dx;
      y += dy;

      // update the previous pen's state to the current one we just sampled
      prev_pen = [pen_down, pen_up, pen_end];
    }
  };

  var process_teacher_input = function(){
    teacher_strokes = [];
    //need to get data from database
    console.log("getCookie");
    var temp = getCookie("teacher_strokes");
    temp = String(temp).split(",");
    var amount = 0;
    var temp_stroke=[];
    for(var i = 0; i < temp.length;i++){
      if(amount < 5){//is ,
        temp_stroke.push(parseInt(temp[i]));
        amount +=1;
      }
      if(amount == 5){
        amount = 0;
        teacher_strokes.push(temp_stroke);
        temp_stroke = [];
      }
    }
    console.log("teacher_strokes:"+JSON.stringify(teacher_strokes));
    draw_example_teach(teacher_strokes,screen_width/2,screen_height/3,line_color,line_width);
  };

  var init_teach = function(){
    screen_width = Math.max(window.innerWidth, 480)/3;
    screen_height = Math.max(window.innerHeight, 320)/3;

    insize_x = screen_width+10;
    insize_y = screen_height+100;
    //only this button
    teach_button = p.createButton("学一学");
    teach_button.parent("button");
    teach_button.style("margin","5px");
    teach_button.mousePressed(teach_button_event);

    teach_canvas = p.createCanvas(insize_x,insize_y);
    teach_canvas.style("border","1px solid red");
    teach_canvas.parent("teach");

    p.frameRate(25);
    p.background(255, 255, 255, 255);
  };
  var teach_button_event = function(){
    restart_teach();
    teach_gate = true;
  }

  //one time draw one line
  var draw_processing = function(example){
    var dx,dy;
    var pen_down, pen_up, pen_end;
    if(fps_number == 0){
      console.log(teach_start);
      teach_x = teach_start[0];
      teach_y = teach_start[1];
    };

      //一次一笔
    if(fps_number < example.length && example){
      [dx, dy, pen_down, pen_up, pen_end] = example[fps_number];

      if (teach_prev_pen[2]== 1) { // end of drawing.[0,0,1]
         //stop drawing and show some tips
         teach_gate = false;
      }
      // only draw on the paper if the pen is touching the paper
      if (teach_prev_pen[0]== 1) {
        p.stroke(line_color);
        p.strokeWeight(line_width);
        p.line(teach_x,teach_y,teach_x+dx,teach_y+dy);
      }

      // update the absolute coordinates from the offsets
      teach_x+=dx;
      teach_y+=dy;
      // update the previous pen's state to the current one we just sampled
      teach_prev_pen=[pen_down, pen_up, pen_end];
    }
    else{ // fps_number > sequence.length
      teach_gate = false;
    }
    if(fps_number == example.length){  //>= and == is equal，show some message
      //show some tips,such as "do you know how to draw? just try it by yourself"
      //alert("do you know how to draw? just try it by yourself!");
        tips = "学会了吗？点击画一画来试一试吧~";
        $.cxDialog({
          title:'结束教学',
          info :tips,
          okText:"好",
          ok:function(){
              learn_gate = true;
          },
          background:"blue",
        });
    }
    fps_number++;
  };

  var restart_teach = function() { 
    fps_number = 0;
    //teacher_strokes = [];
    teach_x = 0;
    teach_y = 0;
    teach_start = [insize_x/2,insize_y/3]; //on the right canvas
    teach_gate = false;
    redraw_screen_teach();
  };

  var redraw_screen_teach = function() {
    var i, j;
    console.log("enter the redraw_screen_teach" + teacher_strokes);
    p.background(255, 255, 255, 255);//this is for clean
    p.fill(255, 255, 255, 255);
  };

  p.setup = function(){
    //console.log("init the canvas");
    init_teach();
    restart_teach();
    //process_teacher_input();//get the teacher's strokes
  };
  p.draw = function(){
    //console.log("teach_gate :"+teach_gate);
    if(teach_gate == true){
      draw_processing(teacher_strokes);
    }
  };
  //p.save(teach_canvas,"teacher.jpg")
};

var sketch = function(p){
  var init = function(){
    screen_width = Math.max(window.innerWidth, 480)/3;
    screen_height = Math.max(window.innerHeight, 320)/3;

    insize_x = screen_width+10;
    insize_y = screen_height+100;
   //select color
    color_sel = p.createSelect();
    color_sel.parent("color")
    for (var i=0;i<color_list.length;i++) {
      color_sel.option(color_list[i]);
    }
    color_sel.changed(select_color_event);
    //select size
    size_sel = p.createSelect();
    size_sel.parent("size")
    for (var i=0;i<size_list.length;i++) {
      size_sel.option(size_list[i]);
    }
    size_sel.changed(select_size_event);
    // dom
    //画一画
    draw_button = p.createButton('画一画');
    draw_button.parent("button");
    draw_button.style("margin","5px");
    draw_button.mousePressed(draw_button_event); // attach button listener
   //提交
    submit_button = p.createButton("提交");
    submit_button.parent("button");
    submit_button.style("margin","5px");
    submit_button.mousePressed(submit_button_event);

    draw_canvas = p.createCanvas(insize_x,insize_y);
    draw_canvas.parent("draw");
    draw_canvas.style("border","1px solid red");

    p.frameRate(60);
    p.background(255, 255, 255, 255);

  };

  var restart = function() { 
    x = insize_x/2.0; //record the user's input;
    y = insize_y/2.0;
    //for student's input
    has_started = false;
    learn_gate = false;


    strokes = [];
    raw_strokes = [];
    raw_lines = [];
    current_raw_line = [];
    start_x = insize_x/2.0;
    start_y = insize_y/2.0;
    redraw_screen();
  };

  var redraw_screen = function(){
    p.background(255, 255, 255, 255);//this is for clean
    p.fill(255, 255, 255, 255);
    if (strokes && strokes.length > 0) {//less point than raw_strokes
      draw_example(strokes, start_x, start_y, line_color, line_width);
    }
    if (raw_strokes && raw_strokes.length > 0) {
      draw_example(raw_strokes, start_x, start_y, line_color,line_width);
    }
  };

  var draw_example = function(example, start_x, start_y, line_color, line_thickness){
    var i;
    var x=start_x, y=start_y;
    var dx,dy;
    var pen_down, pen_up, pen_end;
    var prev_pen = [1, 0, 0];   //start 
    var the_line_thickness = 1.0;
    console.log(start_x,start_y);
    if (typeof line_thickness === "number") {
      the_line_thickness = line_thickness;
    } 
    for(i=0;i<example.length;i++) {
      // sample the next pen's states from our probability distribution
      [dx, dy, pen_down, pen_up, pen_end] = example[i];

      if (prev_pen[2] == 1) { // end of drawing.[0,0,1]
        break;
      }

      // only draw on the paper if the pen is touching the paper
      if (prev_pen[0] == 1) {
        p.stroke(line_color);
        p.strokeWeight(line_width);
        p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
      }

      // update the absolute coordinates from the offsets
      x += dx;
      y += dy;

      // update the previous pen's state to the current one we just sampled
      prev_pen = [pen_down, pen_up, pen_end];
    }
  };

  var draw_button_event = function(){
    restart();
    learn_gate = true;
  };
  var submit_button_event = function(){
    pen = 0;
    learn_gate = false;
    //submit two images to back
    ajaxSubmit();

  };

  var select_color_event = function(){
    var color = color_sel.value();
    line_color = color;
    raw_line_color = color;
  };

  var select_size_event = function(){
    var size = size_sel.value();
    line_width = size;
  };


  p.setup = function(){
    init();
    restart();
    timeStart = Date.parse(new Date());
    //console.log("timeStart: "+timeStart);
  };
  p.draw=function(){
    if(learn_gate ==true){
      process_student_input();
    }
    timeEnd = Date.parse(new Date());
    //console.log("timeEnd:" + timeEnd);
    delayTime = timeEnd-timeStart;
    //console.log("delayTime: "+delayTime);
    /*
    if(pen == 1  && learn_gate == true  && delayTime > 1000*60*0.5){ // 如果超时？
      tips = "结束你的大作了吗？点击提交看看你拿了多少分吧？";
      pen = 0;
      console.log(tips)
      $.cxDialog({
      title:'提示',
      info :tips,
      okText:"好",
      ok:function(){
        timeStart = Date.parse(new Date());
        pen = 0
      },
      background:"blue",
      });
  }*/
  };

  //p.save(draw_canvas,"student.jpg");

  var process_student_input = function(){
    // record pen drawing from user:
    if (p.mouseIsPressed && (p.mouseX <= insize_x) &&(p.mouseX > 0) &&(p.mouseY>0) && (p.mouseY <= insize_y)) { // pen is touching the paper
      if (has_started == false) { // first time anything is written
        has_started = true;
        x = p.mouseX;
        y = p.mouseY;
        start_x = x;//the first point
        start_y = y;
        pen = 0;
        current_raw_line.push([x, y]);
      } else {//other 
        var dx0 = p.mouseX-x; // candidate for dx
        var dy0 = p.mouseY-y; // candidate for dy
        if (dx0*dx0+dy0*dy0 > epsilon*epsilon) { // only if pen is not in same area
          dx = dx0;
          dy = dy0;
          pen = 0;
          if (prev_pen == 0) {
            p.stroke(line_color);
            p.strokeWeight(line_width); // nice thick line
            p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
          }

          // update the absolute coordinates from the offsets
          x += dx;
          y += dy;

          // update raw_lines
          current_raw_line.push([x, y]);
          just_finished_line = true;

          // using the previous pen states, and hidden state, get next hidden state 
          // update_rnn_state();
        }
      }//not the first point
    } else { // pen is above the paper or over the width and heigth
      pen = 1;
      if (just_finished_line) {
        current_raw_line_simple = DataTool.simplify_line(current_raw_line);

        if (current_raw_line_simple.length > 1) {
          if (raw_lines.length === 0) {
            last_point = [start_x, start_y];
          } else {
            idx = raw_lines.length-1;
            last_point = raw_lines[idx][raw_lines[idx].length-1];
          }

          raw_stroke = DataTool.line_to_stroke(current_raw_line, last_point);
          raw_strokes = raw_strokes.concat(raw_stroke);

          stroke = DataTool.line_to_stroke(current_raw_line_simple, last_point);
          raw_lines.push(current_raw_line_simple);
          strokes = strokes.concat(stroke);
          redraw_screen();//draw the user's inputs

        } else {
          if (raw_lines.length === 0) {
            has_started = false;
          }
        }

        current_raw_line = [];
        just_finished_line = false;
      }
    }
    prev_pen = pen;
  };
};

//send image to python back
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

function canvasTodata(canvas){
    var MIME_TYPE = "image/png";

    var dataurl = canvas.toDataURL('image/png');
    var blob = dataURLtoBlob(dataurl);
    return blob;
    //使用ajax发送  return blob;
}

function ajaxSubmit(){
    var origin = canvasTodata(teach_canvas.elt);
    var student = canvasTodata(draw_canvas.elt);//return blob
    var fd = new FormData();
    fd.append("image", origin, "teacher.png");
    fd.append("image",student,"student.png")
    console.log(fd);
    $.ajax({
      url:"/student",
      type:"POST",
      data:fd,
      processData: false, // 不会将 data 参数序列化字符串
      contentType: false, // 根据表单 input 提交的数据使用其默认的 contentType
      success:function(score){
        console.log(score);
        //do something
        ShowScore(score);
      }
    })
};

var getValue = function(model){
  console.log(model)
  $.ajax({
    url:"/select_model",
    type:"POST",
    data:JSON.stringify(model),
    processData: false, // 不会将 data 参数序列化字符串
    contentType: false, // 根据表单 input 提交的数据使用其默认的 contentType
    success:function(origin){
      console.log(origin)
      teacher_strokes = origin;
    }
  })
}

function ShowScore(score){
  score = score*100;
  console.log(score);
  //biggest score is 1, the smallest is 0
  switch(true){
    case score >= 0 && score < 6: showTips(scoreMessage[0]);break;
    case score >= 6 && score < 8:showTips(scoreMessage[1]);break;
    case score >= 8:showTips(scoreMessage[2]);break;
    default:showTips("wrong score!!");
  }
};

var showTips=function(tip){
  console.log(tip)
  $.cxDialog({
      title:'提示',
      info :tip,
      okText:"好",
      ok:function(){
        timeStart = Date.parse(new Date());
      },
      background:"blue",
      });
}

window.onload=function(){
  var learn_p5 = new p5(teach, 'teach');
  var draw_p5 = new p5(sketch,'draw');
  console.log(learn_p5.canvas);
  console.log(draw_p5.canvas);
  
}
