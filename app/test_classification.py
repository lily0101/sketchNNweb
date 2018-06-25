from __future__ import division
import matplotlib as plt
import matplotlib.image as mpimg
import numpy as np
import sys,os
import caffe
import cv2
from sklearn.neighbors import NearestNeighbors, LSHForest
import tensorflow as tf


ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, '/static/data')
caffe_root = APP_ROOT

def sketchClassifier(url,model_name):
    net_file = caffe_root + '/SketchModel/classifier/deploy.prototxt'
    caffe_model = caffe_root + '/SketchModel/classifier/caffe_alexnet_train_sketch_57_43_3_iter_10500.caffemodel'
    mean_file = caffe_root + '/SketchModel/classifier/ilsvrc_2012_mean.npy'

    net = caffe.Net(net_file, caffe_model, caffe.TEST)
    transformer = caffe.io.Transformer({'data': net.blobs['data'].data.shape})
    transformer.set_transpose('data', (2, 0, 1))
    transformer.set_mean('data', np.load(mean_file).mean(1).mean(1))
    transformer.set_raw_scale('data', 255)
    transformer.set_channel_swap('data', (2, 1, 0))

    #url = cv2.imread(url,0)
    im = caffe.io.load_image(url)
    net.blobs['data'].data[...] = transformer.preprocess('data', im)
    out = net.forward()

    imagenet_labels_filename = caffe_root + '/SketchModel/classifier/label.txt'
    labels = np.loadtxt(imagenet_labels_filename, str, delimiter='\t')

    top_k = net.blobs['prob'].data[0].flatten().argsort()[-1:-6:-1]
    score = net.blobs['prob'].data[0].flatten()
    print("before is",top_k)
    for i in np.arange(top_k.size):
        print(top_k[i], labels[top_k[i]], score[top_k[i]])
    print(model_name)
    print(labels[top_k[0]].split(' ')[1])
    model_name = str(model_name)
    predict = str(labels[top_k[0]].split(' ')[1])
    print(model_name == predict)
    if model_name == predict:
        if score[top_k[0]] > 0.3:
            return np.float64(0.8)
        else:
            return np.float64(0.6)
    else:
        return np.float64(0.5)

def compute_map(image_dir,model_name):
    """compute the map in multi-classification"""
    '''/home/chenxingli/graduation_project/sketch-classification/src/preprocess/png/flower'''
    images=[]
    if os.path.isdir(image_dir):
        for i in os.listdir(image_dir):
            url = os.path.join(image_dir,i)
            print(url)
            images.append(url)
    all = len(images)

    print("the all images is :",all)
    right = 0

    for image in images:
        result = sketchClassifier(image,model_name)
        if result > 0.5:
            right = right+1
    #print(right,all)
    #print("the map value is: ",(right/all))
    return right/all

def average_map(dataset_dir):
    #model_name = dataset_dir.split("/")[-1]
    #print(model_name)
    if os.path.isdir(dataset_dir):
        for i in os.listdir(dataset_dir):
            pass


if __name__ == "__main__":
    flower_dir = "/home/chenxingli/graduation_project/sketch-classification/src/preprocess/png/flower"
    airplane_dir = "/data/chenxingli/dataset/sketchRavi/sketches_png_css_thickened/flower with stem/6806/temporal"
    map_flower=compute_map(flower_dir,"flower")

    map_airplane=compute_map(airplane_dir,"flower")
    #print(map_flower,map_airplane)
    map_average = (map_airplane+map_flower)/2
    print("the average accuracy is :",map_average)