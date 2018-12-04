'use strict';

module.exports = function(HTTPError, LotteryModel) {
    return function(req, res, next) {
        var lotteryId = req.query.lottery_id||req.body.lottery_id;
        if(!lotteryId){
            return next(new HTTPError(400, 'lottery id is required'));
        }
        LotteryModel.find({_id:lotteryId}, function(err, lottery){
            if(err){
                return next(new HTTPError(500, err.message));
            }
            if(!lottery){
                return next(new HTTPError(400, 'Lottery not found'));
            }
            if(lottery.currency() !== req.currency){
                return next(new HTTPError(400, 'You are trying to play ' + lottery.currency() + ' using ' + req.currency));
            }
            req.lottery = lottery;
            next();
        });
    };
};
