from skimage.feature import match_template
import matplotlib as plt
import matplotlib.image as mpimg
from app import db, login
import numpy as np
import sys,os
import caffe
import tensorflow as tf

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'data')
caffe_root = os.path.join(APP_ROOT, 'SketchModel')

def sketchClassifier(url):
    net_file = caffe_root + '/classifier/deploy.prototxt'
    caffe_model = caffe_root + '/classifier/caffe_alexnet_train_sketch_57_43_3_iter_10500.caffemodel'
    mean_file = caffe_root + '/classifier/ilsvrc_2012_mean.npy'

    net = caffe.Net(net_file, caffe_model, caffe.TEST)
    transformer = caffe.io.Transformer({'data': net.blobs['data'].data.shape})
    transformer.set_transpose('data', (2, 0, 1))
    transformer.set_mean('data', np.load(mean_file).mean(1).mean(1))
    transformer.set_raw_scale('data', 255)
    transformer.set_channel_swap('data', (2, 1, 0))

    im = caffe.io.load_image(url)
    net.blobs['data'].data[...] = transformer.preprocess('data', im)
    out = net.forward()

    imagenet_labels_filename = caffe_root + '/classifier/label.txt'
    labels = np.loadtxt(imagenet_labels_filename, str, delimiter='\t')

    top_k = net.blobs['prob'].data[0].flatten().argsort()[-1:-6:-1]
    score = net.blobs['prob'].data[0].flatten().sort()
    print(score)
    for i in np.arange(top_k.size):
        print(top_k[i], labels[top_k[i]])
    return score


def allowed_file(filename):
    return '.' in filename and \
       filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def templateMatch(urls):
    image = mpimg.imread(urls[0])
    template = mpimg.imread(urls[1])
    result = match_template(image,template)
    return result