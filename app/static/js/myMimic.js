var sketch = function( p ) { 
  "use strict";

  var color_list = ['red','blue','yellow','green','black'];

  var size_list = ['1','2','4','8','16'];

  var small_class_list = ['flower',
    'ant',
    'angel',
    'bee',
    'bicycle',
    'flamingo',
    'bird',
    'mosquito',
    'owl',
    'spider',
    'yoga',
    'cat'];

  var large_class_list = ['flower',
    'ant',
    'angel',
    'bee',
    'bicycle',
    'flamingo',
    'bird',
    'mosquito',
    'owl',
    'spider',
    'yoga',
    'cat'];

  var use_large_models = true;

  var class_list = small_class_list;

  if (use_large_models) {
    class_list = large_class_list;
  }

  var origin_x, origin_y;
  var insize_x, insize_y,outsize_x,outsize_y;

  var Nsize = 2; // output will be a matrix of Nsize x Nsize;
  var line_width = 1.0;
  var min_sequence_length = 5;

  // input variables:
  var dx, dy; // offsets of the pen strokes, in pixels
  var pen = 0;
  var prev_pen = 1;
  var x, y; // absolute coordinates on the screen of where the pen is
  var start_x, start_y;
  var has_started = false; // set to true after user starts writing.
  var just_finished_line = false;
  var start_vae = false;
  var epsilon = 2; // to ignore data from user's pen staying in one spot.
  var screen_width, screen_height; // stores the browser's dimensions
  var raw_lines;
  var current_raw_line;
  var current_raw_line_simple;
  var strokes, raw_strokes;
  var stroke, raw_stroke;
  var last_point, idx;
  var line_color, raw_line_color;

  // model related
  var model, model_data;
  var temperature = 0.25;
  var screen_scale_factor = 3.0;
  var async_draw = true;


  // individual models (2d arrays)
  var model_state;
  var model_x, model_y, model_z;
  var model_dx, model_dy;
  var model_is_active;
  var model_steps;
  var model_prev_pen;

  // dom
  var canvas;
  var button2;
  var canvas1;
  var canvas2;
  var reset_button;
  var model_sel;
  var color_sel;
  var size_sel;
  var temperature_slider;
  var text_instruction;
  var text_model_info;
  var text_temperature;
  var random_model_button;
  var vae_button;
  var text_title;
  var title_text = "Mimic bird auto-encoder drawing";
  //var text_temperature;//record the changed value
  var temp_title;//just for show temperature

  var print = function(x) {
    console.log(x);
  };

  var set_title_text = function(new_text) {
    text_title.html(new_text.split('_').join(' '));
  };

  var Create2DArray = function(rows, cols) {
    var arr = [];

    for (var i=0;i<rows;i++) {
       arr[i] = new Array(cols);
    }

    return arr;
  };

  var draw_example = function(example, start_x, start_y, line_color, line_thickness) {
    var i;
    var x=start_x, y=start_y;
    var x, y;
    var pen_down, pen_up, pen_end;
    var prev_pen = [1, 0, 0];   //start 
    var the_line_thickness = 1.0;
    console.log("input_strokes="+JSON.stringify(example));
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
        p.strokeWeight(the_line_thickness);
        p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
      }

      // update the absolute coordinates from the offsets
      x += dx;
      y += dy;

      // update the previous pen's state to the current one we just sampled
      prev_pen = [pen_down, pen_up, pen_end];
    }

  };

  var init = function() {
    var i, j;
    origin_x = Create2DArray(Nsize, Nsize);//the two dim array
    origin_y = Create2DArray(Nsize, Nsize);
    //screen_width = Math.max(window.innerWidth, 480);
    //screen_height = Math.max(window.innerHeight, 320);

    screen_width = Math.max(window.innerWidth*0.80, 480);
    screen_height = Math.max(window.innerHeight*0.6, 320);


    insize_x = screen_width/2;
    insize_y = screen_height;
    outsize_x = screen_width/(2*Nsize);
    outsize_y = screen_height/Nsize;
    //modelimporter just a tool to load init to ant
    ModelImporter.set_init_model(model_raw_data);//the model_raw_data from the trained model,from the ant.gen.js
    if (use_large_models) {
      ModelImporter.set_model_url("https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/");
    }

    model_data = ModelImporter.get_model_data();
    model = new SketchRNN(model_data);
    model.set_pixel_factor(screen_scale_factor);

    

    // individual models:
    model_state = Create2DArray(Nsize, Nsize);//one point for one state
    model_x = Create2DArray(Nsize, Nsize);
    model_y =  Create2DArray(Nsize, Nsize);
    model_dx = Create2DArray(Nsize, Nsize);
    model_dy = Create2DArray(Nsize, Nsize);
    model_z =  Create2DArray(Nsize, Nsize); // will be tanh'ed.
    model_is_active = Create2DArray(Nsize, Nsize);
    model_steps = Create2DArray(Nsize, Nsize);
    model_prev_pen = Create2DArray(Nsize, Nsize);

    // dom
    reset_button = p.createButton('start over');
    reset_button.parent("button");
    reset_button.style("margin","5px");
    //reset_button.position(5, insize_x-25);
    reset_button.mousePressed(reset_button_event); // attach button listener

    // data selection
    model_sel = p.createSelect();
    for (i=0;i<class_list.length;i++) {
      model_sel.option(class_list[i]);
    }
    //model_sel.position(95, insize_x-25);
    model_sel.parent("model");
    model_sel.changed(model_sel_event);

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
    // random model buttom
    /*
    random_model_button = p.createButton('random');
    random_model_button.position(226, insize_x-25);
    random_model_button.mousePressed(random_model_button_event); // attach button listener
    */
    // vae button
    vae_button = p.createButton('Mimic encode');
    vae_button.parent("button")
    //vae_button.position(290, insize_x-25);
    vae_button.mousePressed(vae_button_event); // attach button listener

    // temperature text
    text_temperature = p.createP();
    text_temperature.style("font-family", "Courier New");
    text_temperature.style("font-size", "12");
    //update_temperature_text(title_text);
    //slider
    temperature_slider = p.createSlider(1, 100, temperature*100);
    temperature_slider.style('width', screen_width/1-25+'px');
    temperature_slider.changed(temperature_slider_event);
    // text descriptions
    text_instruction = p.createP("");
    text_instruction.style("font-family", "monospace");
    //text_instruction.position(10, insize_x-60);
    //text_instruction.hide();

    text_title = p.createP(title_text);
    text_title.style("font-family", "monospace");
    text_title.style("font-size", "16");
    text_title.style("color", "#ff990a");
    text_title.parent("text");
    //text_title.position(10, -10);
    //submit
    button2 = p.createButton("submit");
    button2.parent('button');
    button2.style('margin','5px')
    button2.mousePressed(finishOneKind);

    //record the teacher's or students' drawing 
    canvas = p.createCanvas(screen_width,screen_height);//parent
    canvas.style("border","1px solid red")
    //canvas.position(0, 0);
    p.frameRate(60);
    p.background(255, 255, 255, 255);

  };

  var reset_screen_text = function() {
    var class_name = model.name;
    class_name = class_name.split('_').join(' ')
    text_instruction.html('draw complete '+class_name+'.');
    text_temperature.html("temperature: "+temperature);
  };

  var finishOneKind = function(){
    //var name = end_type.value();
    //setCookie("teacher_strokes",strokes);
    strokes.concat([0,0,0,0,1])
      //add this to cookie
    var dataStrokes = {
        "strokes": strokes,
        "model":model_sel.value(),
    }
    $.ajax({
        url:"/teacher_mimic",
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

  var redraw_screen = function() {
    var i, j;

    p.background(255, 255, 255, 255);//this is for clean
    p.fill(255, 255, 255, 255);

    reset_screen_text();//update the value of the tempreture
    for(i=0;i<Nsize;i++) {
      for(j=0;j<Nsize;j++) {
        origin_x[i][j] = j*outsize_x+screen_width/2;//if Nsize == 1, the origin_x = screen_width/2
        origin_y[i][j] = i*outsize_y;
      }
    }
    
    p.stroke("green");//line color
    p.strokeWeight(0.5);//line size
    p.line(screen_width/2,1,screen_width/2,screen_height);//location and width,start from the canvas
    
    for(i=0;i<Nsize;i++) {
      p.line(screen_width/2+outsize_x*i-1, 1, screen_width/2+outsize_x*i-1, screen_height);//first point and end point
    }
    for(j=1;j<Nsize;j++) {
      p.line(screen_width/2-1, outsize_y*j, screen_width, outsize_y*j);
    }
    // draw human drawing
    if (strokes && strokes.length > 0) {//less point than raw_strokes
      draw_example(strokes, start_x, start_y, line_color, 3.0);
    }
    if (raw_strokes && raw_strokes.length > 0) {
      draw_example(raw_strokes, start_x, start_y, raw_line_color, line_width);
    }
   
  };

  var restart_all_models = function() {
    var i, j;

    // individual models:
    for (i=0;i<Nsize;i++) {
      for (j=0;j<Nsize;j++) {
        model_state[i][j] = model.zero_state();
        model_x[i][j] = 0;
        model_y[i][j] = 0;
        model_dx[i][j] = 0;
        model_dy[i][j] = 0;
        model_z[i][j] = null;
        model_is_active[i][j] = false;
        model_steps[i][j] = 0;
        model_prev_pen[i][j] = [0, 0, 0];
      }
    }

    // turn off vae by default
    start_vae = false;
  };

  var encode_all_models = function(sx, sy, sequence) {//will be called in slider change,mimic encode button. model_sel_event
    //sx,sy is the coordinate of the first pooint
    var i, j;
    var mu, sigma;
    if (sequence.length <= min_sequence_length) {
      return;
    }
    var short_sequence = model.copy_drawing(sequence, model.max_seq_length);

    [mu, sigma] = model.encode_to_mu_sigma(short_sequence);

    // individual models:

    for (i=0;i<Nsize;i++) {
      for (j=0;j<Nsize;j++) {
        model_z[i][j] = model.encode_from_mu_sigma(mu, sigma);
        model_state[i][j] = model.get_init_state_from_latent_vector(model_z[i][j]);
        model_x[i][j] = sx;
        model_y[i][j] = sy;
        model_dx[i][j] = 0;
        model_dy[i][j] = 0;
        model_is_active[i][j] = true;
        model_steps[i][j] = 0;
        model_prev_pen[i][j] = [0, 0, 0];
      }
    }

  };

  var inside_box = function(x, y) {
    if (x >0 && y > 0 && x < outsize_x && y < outsize_y) {//outsize is the mimic's width and height
      return true;
    }
    return false;
  };

  var process_models = function() {
    /*
    teacher or student finished their drawing
    */
    var i, j;

    var pdf; // store all the parameters of a mixture-density distribution
    var m_dx, m_dy, m_x, m_y;
    var m_pen_down, m_pen_up, m_pen_end;
    var x0, y0, x1, y1;

    var o_x, o_y;

    var scale = Nsize;
    var fudge = 0;

    // individual models:
    for (i=0;i<Nsize;i++) {
      for (j=0;j<Nsize;j++) {

        if (model_steps[i][j] > model.max_seq_len) {
          model_is_active[i][j] = false;
        }

        if (model_is_active[i][j]) { // model_is_active is true; restart_all_model set to false;encode_all_models set to true
          o_x = origin_x[i][j]+fudge;//fudge == 0
          o_y = origin_y[i][j]+fudge;
          m_x = model_x[i][j];//the absolute coordinate
          m_y = model_y[i][j];
          m_dx = model_dx[i][j]; //the relative
          m_dy = model_dy[i][j];
          m_pen_down = model_prev_pen[i][j][0];
          m_pen_up = model_prev_pen[i][j][1];
          m_pen_end = model_prev_pen[i][j][2];
          model_state[i][j] = model.update([m_dx, m_dy, m_pen_down, m_pen_up, m_pen_end], model_state[i][j], model_z[i][j]);
          model_steps[i][j] += 1;
          pdf = model.get_pdf(model_state[i][j]);
          [m_dx, m_dy, m_pen_down, m_pen_up, m_pen_end] = model.sample(pdf, temperature, 0.5+0.5*temperature);
          if (m_pen_end === 1) {//finish the mimic behavior
            model_is_active[i][j] = false;
            if (!async_draw) {
              continue;
            } else {
              return;  
            }
          }

          if (model_prev_pen[i][j][0] == 1) { // 
            // draw line connecting prev point to current point.
            x0 = m_x/scale;
            y0 = m_y/scale;
            x1 = (m_x+m_dx)/scale;
            y1 = (m_y+m_dy)/scale;
            if (inside_box(x0, y0) && inside_box(x1, y1)) {
              p.stroke(raw_line_color);
              p.strokeWeight(line_width);
              p.line(o_x+x0, o_y+y0, o_x+x1, o_y+y1);
            }
          }

          model_dx[i][j] = m_dx;
          model_dy[i][j] = m_dy;
          model_prev_pen[i][j] = [m_pen_down, m_pen_up, m_pen_end];
          model_x[i][j] += m_dx;
          model_y[i][j] += m_dy;

          if (!async_draw) {
            return; // draw one at a time
          }

        }

      }
    }

  };

  var restart = function() {

    restart_all_models();//all to init state x,y=0, state=null, 

    // input setup
    // start drawing from somewhere in middle of the canvas
    var r = p.random(64, 224);
    var g = p.random(64, 224);
    var b = p.random(64, 224);
    line_color = p.color(r, g, b, 64);
    raw_line_color = p.color(r, g, b, 255);;
    x = insize_x/2.0;
    y = insize_y/2.0;
    has_started = false;

    strokes = [];
    raw_strokes = [];
    raw_lines = [];
    current_raw_line = [];

    redraw_screen();
  };

  p.setup = function() {
    init();//create the framework
    restart();
  };

  var process_user_input = function() {
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
            p.stroke(raw_line_color);
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

          // stop it!
          restart_all_models();//all variable is set to init state  model_,y,dx,dy=0

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

  p.draw = function() {
    process_user_input();
    if (pen === 1) { //pen is set to be when finish your drawing, just when you button the button mimic encode
      process_models();
    }
  };

  var random_model_button_event = function() {
    var item = class_list[Math.floor(Math.random()*class_list.length)];
    model_sel.value(item);
    model_sel_event();
  };
  
  var select_color_event = function(){
    var color = color_sel.value();
    console.log("change the color of the drawing");
    //p.color(color);
  };

  var select_size_event = function(){
    var size = size_sel.value();
    console.log("change the color of the drawing");
    //p.size(size);
  };
  var reset_button_event = function() {
    restart();
  };

  var temperature_slider_event = function() {
    temperature = temperature_slider.value()/100;
    start_vae = true;
    redraw_screen();
    restart_all_models();
    encode_all_models(start_x, start_y, strokes);
  };

  var vae_button_event = function() {
    start_vae = true;
    redraw_screen();
    restart_all_models();
    encode_all_models(start_x, start_y, strokes);
  };

  var model_sel_event = function() {
    var c = model_sel.value();
    var v = "vae";
    var call_back = function(new_model) {
      model = new_model;
      model.set_pixel_factor(screen_scale_factor);
      redraw_screen();
      restart_all_models();
      encode_all_models(start_x, start_y, strokes);
      set_title_text('Mimic '+model.info.name+' auto-encoder drawing.');
      var large_model_mode = false;
      async_draw = true;
      if (model.zero_state()[0].size > 512) {
        large_model_mode = true;
        async_draw = false;
      }
    }
    set_title_text('loading '+c+' model...<br/><br/><br/>input disabled.');
    ModelImporter.change_model(model, c, v, call_back);
  };

};
var custom_p5 = new p5(sketch, 'sketch');
