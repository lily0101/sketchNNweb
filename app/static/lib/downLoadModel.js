var model;
var model_data;
var use_large_models = true;

ModelImporter.set_init_model(model_raw_data);
if (use_large_models) {
   ModelImporter.set_model_url("https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/");
}
model_data = ModelImporter.get_model_data();
model = new SketchRNN(model_data);
model.set_pixel_factor(screen_scale_factor);

var downModel = function(model_selected){
  var c = model_selected
   var model_mode = "gen";
   console.log("user wants to change to model "+c);
   var call_back = function(new_model) {
    model = new_model;
    model.set_pixel_factor(screen_scale_factor);
  }
  console.log("finish the download model!")
  ModelImporter.change_model(model, c, model_mode, call_back);
}

downModel("flower")