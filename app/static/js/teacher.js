/*
* using the p5.js library 
*/
var color_list = ['red','blue','yellow','black','green']
var size_list = ['1','2','4','8','16']

// variables we need for this demo
var dx, dy; // offsets of the pen strokes, in pixels
var pen = 0;
var prev_pen = 1;
var x, y; // absolute coordinates on the screen of where the pen is，鼠标的绝对坐标
var start_x, start_y;

var has_started = false; // set to true after user starts writing.
var just_finished_line = false;
var epsilon = 2.0; // to ignore data from user's pen staying in one spot.

var screen_width, screen_height; // stores the browser's dimensions

var raw_lines = [];
var current_raw_line = [];
var current_raw_line_simple;
var strokes = [];
var stroke;

var last_point, idx;

var line_color = 'red';
var line_width = '2.0';

//dom
var color_sel;
var size_sel;
var end_button;
var canvas;
var clean_button;
var end_type;
var button2
var message;

var sketch = function( p ) { 
  "use strict";
  
//setCookie
  function setCookie(name,value) { 
    var Days = 365; 
    var exp = new Date(); 
    exp.setTime(exp.getTime() + Days*24*60*60*1000); 
    document.cookie = name + "="+ value + ";expires=" + exp.toGMTString()+"path=/"; 
  };

  var draw_example = function(example, start_x, start_y, line_color) {
    var i;
    var x=start_x, y=start_y;
    var x, y;
    var pen_down, pen_up, pen_end;
    var prev_pen = [1, 0, 0];

    console.log("input_strokes="+JSON.stringify(example));

    for(i=0;i<example.length;i++) {
      // sample the next pen's states from our probability distribution
      [dx, dy, pen_down, pen_up, pen_end] = example[i];

      if (prev_pen[2] == 1) { // end of drawing.
        break;
      }
    // delete it I think it can't be influenced
      // only draw on the paper if the pen is touching the paper
      if (prev_pen[0] == 1) {//this is for showing it perpetual
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
 /*
 // restart function
 */
  var restart = function() {
    // reinitialize variables before calling p5.js setup.

    //line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));

    // make sure we enforce some minimum size of our demo
    screen_width = 400;
    screen_height = 320;

    // start drawing from somewhere in middle of the canvas
    x = screen_width/2.0;
    y = screen_height/2.0;    

    has_started = false;

  };

  /*
  /// init function
  */
  //create some button
  var init = function(){
    //dom
    clean_button = p.createButton('clean drawing');
    clean_button.parent('button');
    clean_button.style('margin','5px');
    clean_button.mousePressed(redraw_screen);
    /*
    end_button = p.createButton('end draw');
    end_button.parent('button');
    end_button.style('margin','5px');
    end_button.mousePressed(sendStrokes); // attach button listener
    */
    color_sel = p.createSelect();
    color_sel.parent("color")
    for (var i=0;i<color_list.length;i++) {
      color_sel.option(color_list[i]);
    }
    color_sel.changed(select_color_event);

    //size select
    size_sel = p.createSelect();
    size_sel.parent("size")
    for (var i=0;i<size_list.length;i++) {
      size_sel.option(size_list[i]);
    }
    size_sel.changed(select_size_event);
    //canvas
    canvas = p.createCanvas(screen_width, screen_height);
    canvas.parent('container');
    canvas.style("padding", "0");
    canvas.style("margin","auto");
    canvas.style("display","block");
    canvas.style("border","1px solid black")
    p.frameRate(60);//get 60 srokes in on second?
    p.background(255, 255, 255, 255);

    //finish type
    /*
    message = p.createP("What's your drawing?")
    message.parent("container")
    end_type = p.createInput();
    end_type.parent("container");
    end_type.style("margin",'5px')
     */
    button2 = p.createButton("submit");
    button2.parent('container');
    button2.style('margin','5px')
    button2.mousePressed(finishOneKind);  
  };


  var select_color_event = function(){
    var color = color_sel.value();
    line_color = color;
    //raw_line_color = color;
  };

  var select_size_event = function(){
    var size = size_sel.value();
    line_width = size;
  };
/*
// finised one class, when you finished  many many many drwaing, this should be controll by manager
*/
//submmit function
  var finishOneKind = function(){
    //var name = end_type.value();
    //setCookie("teacher_strokes",strokes);
    strokes.concat([0,0,0,0,1])
      //add this to cookie
    var dataStrokes = {
        "strokes": strokes,
    }
    $.ajax({
        url:"/teacher",
        type:"POST",
        data:JSON.stringify(dataStrokes),
        dataType:'json',
        processData: false, // 不会将 data 参数序列化字符串
        contentType: false, // 根据表单 input 提交的数据使用其默认的 contentType
        success:function(msg){
          console.log(msg);
          // alert('Done,Picture Uploaded')  //get success id
    }
   })
    redraw_screen();
    //end_type.value('');
};

/*
// clean the canvas
*/
//there some problem in clean screen need to debug
  var redraw_screen =function(){
    restart();
      //clean all variable
    strokes = [];
    stroke = [];
    raw_lines = [];
    current_raw_line = [];
    current_raw_line_simple = [];
    pen = 0;
    prev_pen = 1;
    just_finished_line =false;
    // start drawing from somewhere in middle of the canvas
    x = 0;
    y = 0;    
    last_point = []

     //canvas
    //canvas.remove();
    canvas.background(255,255,255,255)
  };

//start from here
  p.setup = function() {
    restart(); // initialize variables for this demo
    init();
  };

//setup之后进入draw()函数的不断循环调用
  p.draw = function() {
    // record pen drawing from user:
    if (p.mouseIsPressed && p.mouseY <= 320 && p.mouseY >= 0 && p.mouseX <= 400 && p.mouseX >= 0) { // pen is touching the paper
     // console.log(canvas.position);
      if (has_started == false) { // first time anything is written
        has_started = true;
        x = p.mouseX;
        y = p.mouseY;

        start_x = x;
        start_y = y;
        console.log(start_x,start_y)
        pen = 0;
        /*
        p.stroke(line_color);
        p.strokeWeight(2.0);
        p.ellipse(x, y, 5, 5); // draw line connecting prev point to current point.
        */
      }
      var dx0 = p.mouseX-x; // candidate for dx
      var dy0 = p.mouseY-y; // candidate for dy
      if (dx0*dx0+dy0*dy0 > epsilon*epsilon) { // only if pen is not in same area
        dx = dx0;
        dy = dy0;
        pen = 0;
        if (prev_pen == 0) {//draw the line 
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
    } else { // pen is above the paper
      pen = 1;
      if (just_finished_line) {
        current_raw_line_simple = DataTool.simplify_line(current_raw_line);

        if (current_raw_line_simple.length > 1) {
          if (raw_lines.length === 0) {//first line
            last_point = [start_x, start_y];
          } else {
            idx = raw_lines.length-1;
            last_point = raw_lines[idx][raw_lines[idx].length-1];//last point is the last point of last line
          }

          stroke = DataTool.line_to_stroke(current_raw_line_simple, last_point);//change it to relative position 
          //there is a question is about the line_to_stroke
          raw_lines.push(current_raw_line_simple);
          strokes = strokes.concat(stroke); //whole drawing 
           
          p.background(255, 255, 255, 255);
          p.fill(255, 255, 255, 255);
          draw_example(strokes, start_x, start_y, line_color);
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

function getValue(model){  
    // method 2   
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
        //do something
        //ShowScore(score);
      }
    })
}
//set the stokes 
window.onload=function(){
  var custom_p5 = new p5(sketch, 'sketch');

}


