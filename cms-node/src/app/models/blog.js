'use strict';

var Blog = function (mongoose) {

    var BlogsSchema = new mongoose.Schema({
        author: String,
        content: String,
        title: String,
        slug: String,
        date_created: {type: Date, default: Date.now}
    });

    var Blog = mongoose.model('Blog', BlogsSchema);
    
    this.create = function (data, cb){
        var blog = new Blog();
        blog.content = data.content;
        blog.title = data.title;
        blog.slug = data.slug;
        blog.save(function(err, blog){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, blog);
            }
        });  

    };

    this.update = function (id, blog, cb){
        Blog.findByIdAndUpdate(id, {$set : {content: blog.content, title: blog.title, slug:blog.slug}}, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }
        });
    };

    // get specific ticket document
    this.read = function (id, cb){
        var query;
        try {
            var _id = new mongoose.Types.ObjectId(id);
            query = {_id: _id};
        } catch (ex) {
            query = {slug: id};
        }
            
        Blog.collection.findOne(query, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                console.log(doc);
                return cb(null, doc);
            }           
        });
    };

    // get specific ticket document
    this.reads = function (cb){
        Blog.find().sort('-date_created').exec(function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }           
        });
    };

    this.delete = function(id, cb){
        Blog.findByIdAndRemove(id, function(err){
            if(err instanceof Error){
                return cb(err);
            } else {
                return cb(true);
            }           
        });
    };
};

exports.Blog = Blog;
