'use strict';

var Wiki = function (mongoose) {

    var WikisSchema = new mongoose.Schema({
        content: String,
        title: String,
        slug: String,
        date_created: {type: Date, default: Date.now}
    });

    var Wiki = mongoose.model('Wiki', WikisSchema);

    this.create = function (data, cb){
        var wiki = new Wiki();
        wiki.content = data.content;
        wiki.title = data.title;
        wiki.slug = data.slug;
        wiki.save(function(err, wiki){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, wiki);
            }
        });

    };

    this.update = function (id, wiki, cb){
        Wiki.findByIdAndUpdate(id, {$set : {content: wiki.content, title: wiki.title, slug: wiki.slug}}, function(err, doc){
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
            
        Wiki.collection.findOne(query, function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }
        });
    };

    this.reads = function (cb){
        Wiki.find(function(err, doc){
            if(err instanceof Error){
                return cb(err, null);
            } else {
                return cb(null, doc);
            }
        });
    };

    this.delete = function(id, cb){
        Wiki.findByIdAndRemove(id, function(err){
            if(err instanceof Error){
                return cb(err);
            } else {
                return cb(true);
            }
        });
    };
};

exports.Wiki =  Wiki;
