'use strict';

var Press = function (mongoose) {

    var PresssSchema = new mongoose.Schema({
        content: String,
        title: String,
        slug: String,
        date_created: {type: Date, default: Date.now}
    });

    var Press = mongoose.model('Press', PresssSchema);

    this.create = function (data, cb){
        var press = new Press();
        press.content = data.content;
        press.title = data.title;
        press.slug = data.slug;
        press.save(function(err, press){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, press);
            }
        });

    };

    this.update = function (id, press, cb){
        Press.findByIdAndUpdate(id, {$set : {content: press.content, title: press.title, slug: press.slug}}, function(err, doc){
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
            
        Press.collection.findOne(query, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }
        });
    };

    this.reads = function (cb){
        Press.find(function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }
        });
    };

    this.delete = function(id, cb){
        Press.findByIdAndRemove(id, function(err){
            if(err instanceof Error){
                return cb(err);
            } else {
                return cb(true);
            }
        });
    };
};

exports.Press =  Press;
