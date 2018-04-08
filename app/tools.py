from skimage.feature import match_template
import matplotlib as plt
import matplotlib.image as mpimg
from app import db, login
import numpy as np
import sys,os
import caffe
from sklearn.neighbors import NearestNeighbors, LSHForest
import tensorflow as tf

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, '/static/data')
caffe_root = APP_ROOT

def sketchClassifier(url):
    net_file = caffe_root + '/SketchModel/classifier/deploy.prototxt'
    caffe_model = caffe_root + '/SketchModel/classifier/caffe_alexnet_train_sketch_57_43_3_iter_10500.caffemodel'
    mean_file = caffe_root + '/SketchModel/classifier/ilsvrc_2012_mean.npy'

    net = caffe.Net(net_file, caffe_model, caffe.TEST)
    transformer = caffe.io.Transformer({'data': net.blobs['data'].data.shape})
    transformer.set_transpose('data', (2, 0, 1))
    transformer.set_mean('data', np.load(mean_file).mean(1).mean(1))
    transformer.set_raw_scale('data', 255)
    transformer.set_channel_swap('data', (2, 1, 0))

    im = caffe.io.load_image(url)
    net.blobs['data'].data[...] = transformer.preprocess('data', im)
    out = net.forward()

    imagenet_labels_filename = caffe_root + '/SketchModel/classifier/label.txt'
    labels = np.loadtxt(imagenet_labels_filename, str, delimiter='\t')

    top_k = net.blobs['prob'].data[0].flatten().argsort()[-1:-6:-1]
    score = net.blobs['prob'].data[0].flatten()
    print("before is",top_k)
    print("the result is {0}:".format(score))
    for i in np.arange(top_k.size):
        print(top_k[i], labels[top_k[i]], score[top_k[i]])
    return np.float64(score[top_k[0]])

def allowed_file(filename):
    return '.' in filename and \
       filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def templateMatch(urls):
    image = mpimg.imread(urls[0])
    template = mpimg.imread(urls[1])
    result = match_template(image,template)
    return result

def SketchToImage(image):
    '''

    :param image:
    :return: the retrivel images url in disk, because you have to show that in html
    '''
    print("caffe_root is {0}".format(caffe_root))
    model_root = caffe_root+ '/SketchModel/sketchy'
    print("model root is :"+ model_root)
    PRETRAINED_FILE = model_root+ '/models/triplet_googlenet/triplet_googlenet_finegrain_final.caffemodel'
    sketch_model = model_root+ '/models/triplet_googlenet/Triplet_googlenet_sketchdeploy.prototxt'
    image_model = model_root+ '/models/triplet_googlenet/Triplet_googlenet_imagedeploy.prototxt'
    caffe.set_mode_cpu()
    print("sketch_model is :{0}".format(sketch_model))
    sketch_net = caffe.Net(sketch_model, PRETRAINED_FILE, caffe.TEST)
    img_net = caffe.Net(image_model, PRETRAINED_FILE, caffe.TEST)
    sketch_net.blobs.keys()
    # TODO: set output layer name. You can use sketch_net.blobs.keys() to list all layer
    output_layer_sketch = 'pool5/7x7_s1_s'
    output_layer_image = 'pool5/7x7_s1_p'
    # set the transformer
    transformer = caffe.io.Transformer({'data': np.shape(sketch_net.blobs['data'].data)})
    transformer.set_mean('data', np.array([104, 117, 123]))
    transformer.set_transpose('data', (2, 0, 1))
    transformer.set_channel_swap('data', (2, 1, 0))
    transformer.set_raw_scale('data', 255.0)
    # TODO: specify photo folder for the retrieval
    photo_paths = APP_ROOT + "/static/images/mixImages/"
    # load up images
    img_list = os.listdir(photo_paths)
    N = np.shape(img_list)[0]
    print('Retrieving from', N, 'photos')
    # extract feature for all images
    feats = []
    for i, path in enumerate(img_list):
        imgname = path.split('/')[-1]
        imgname = imgname.split('.jpg')[0]
        imgcat = path.split('/')[0]
        #print ('\r', str(i + 1) + '/' + str(N) + ' ' + 'Extracting ' + path + '...',)
        full_path = photo_paths + path
        img = (transformer.preprocess('data', caffe.io.load_image(full_path.rstrip())))
        img_in = np.reshape([img], np.shape(sketch_net.blobs['data'].data))
        out_img = img_net.forward(data=img_in)
        out_img = np.copy(out_img[output_layer_image])
        feats.append(out_img)
        #print ('done',)
    print(np.shape(feats))
    feats = np.resize(feats, [np.shape(feats)[0], np.shape(feats)[2]])  # quick fixed for size
    print("after resize: {0}".format(np.shape(feats)))
    # build nn pool
    nbrs = NearestNeighbors(n_neighbors=np.size(feats, 0), algorithm='brute', metric='cosine').fit(feats)
    # Load up sketch query
    sketch_in = (transformer.preprocess('data', caffe.io.load_image(image)))
    sketch_in = np.reshape([sketch_in], np.shape(sketch_net.blobs['data'].data))
    query = sketch_net.forward(data=sketch_in)
    query = np.copy(query[output_layer_sketch])
    print("the sketch's shape is {0}".format(np.shape(query)))

    # get nn
    distances, indices = nbrs.kneighbors([np.reshape(query, [np.shape(query)[1]])])

    # show query


    # show results
    top5_images = []
    for i in range(1, 5, 1):
        #f = plt.figure(i)
        url = photo_paths + img_list[indices[0][i - 1]]
        top5_images.append(url)
        print(url)
        #plt.imshow(img)
        #plt.axis('off')
        #plt.show(block=False)

    return top5_images
