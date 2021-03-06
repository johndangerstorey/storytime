'use strict';
const braintree = require('braintree');
const User = require('../models/User');
const ResponseUtil = require('../util/ResponseUtil');
const UserUtil = require('../util/UserUtil');
const Bluebird = require("bluebird");

var gateway = braintree.connect({
  environment: braintree.Environment[process.env.NODE_ENV],
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUB_KEY,
  privateKey: process.env.BRAINTREE_PRI_KEY
});

const createUser = function(user, nonceFromTheClient){
  return new Bluebird(function(resolve, reject) {
    gateway.customer.create({
      firstName: user.profile.name,
      paymentMethodNonce: nonceFromTheClient
    }, function (err, result) {
      if(result.success){
        user.paymentInfo.paymentMethodToken = result.customer.paymentMethods[0].token;
        user.paymentInfo.customerId = result.customer.id;
        user.markModified('paymentInfo');
        user.save((err, user) => {
          if (err) {
            ResponseUtil.error(req, res, err);
          } else {
            resolve(user);
          }
        });
      }
    });
  });
}

exports.getBraintreeToken = (req, res) => {
  console.log(req.query.customerId)
  gateway.clientToken.generate({customerId: req.query.customerId}, function (err, response) {
    if(err){
      ResponseUtil.error(req, res, err);
      console.error('error generating token - possible connection issues');
    }
    else { ResponseUtil.success(req, res, response.clientToken); }
  });
};

exports.processPayment = (req, res) => {
  const {amount, recurring, nonce, paymentMethodToken } = req.body;
  function proccess(amount, recurring, paymentMethodToken, customer) {
    gateway.transaction.sale({
      amount: amount,
      paymentMethodToken: paymentMethodToken,
      recurring: recurring,
      customerId: customer,
      options: { submitForSettlement: true }
    }, function (err, result) {
      if(err){
        ResponseUtil.error(req, res, err);
      } else {
        var multiplier = result.transaction.recurring ? 2 : 1;
        var coins = result.transaction.amount *  multiplier * 100;
        UserUtil.addCoins(req.user.id, coins).then(function(response){
          ResponseUtil.success(req, res, {coins: coins})
        })
      }
    });
  }
  if(!paymentMethodToken){
    createUser(req.user, nonce).then(function(user){
      proccess(amount, recurring, user.paymentInfo.paymentMethodToken, user.paymentInfo.customerId)
    })
  } else {
    proccess(amount, recurring, paymentMethodToken, req.user.paymentInfo.customerId)
  }
}

exports.getPayments = (req, res) => {
  //TODO: group by the storyId
  // User.aggregate(
  //   [
  //     { $project : { purchased : 1 } }
  //     { $group : { _id : "$storyId" } }
  //   ]
  // ).exec((err, res) => { debugger })
  User.find( {}, { purchased: 1 }, (err, purchased) => {
    if(err){ ResponseUtil.error(req, res, err)}
    else{
      const purchases = {};
      purchased.forEach(function(user){
        Object.keys(user.purchased).map(function(key, index) {
          delete user.purchased[key].storyId
          user.purchased[key].userId = user._id;
          const purchaseObj = user.purchased[key];
          const existingArray = purchases[key];
          if (existingArray) {
            purchases[key].details.push(purchaseObj)
            purchases[key].coins += purchaseObj.price
          }
          else {
            purchases[key] = {
              details: Array(purchaseObj),
              storyId: key,
              coins: purchaseObj.price
            }
          }
        });
      })
      ResponseUtil.success(req, res, purchases)
    }
  })
},

exports.payWithCoins = (req,res) => {
  console.log('pay with coins entered')
  User.findById(req.user.id, (err, user) => {
    var coins = isNaN(req.body.price) ? 0 : req.body.price;
    console.log('coins ', coins)
    var storyId = req.body.storyId

    if (err) { return next(err); }
    if (user.purchased.hasOwnProperty(storyId)){
      ResponseUtil.success(req, res, {message: 'Story has already been unlocked'})
    } else {
      var set = { purchased: user.purchased || {} };
      set.purchased[storyId] = {
        storyId: storyId,
        purchaseDate: new Date(),
        price: coins
      };

      User.update(
         { _id: user._id },
         {
           $set: set,
           $inc: { 'paymentInfo.coins': -coins }
         },
         (err, user) => {
           if (err) {
             ResponseUtil.error(req, res, err);
           } else {
             ResponseUtil.success(req, res);
           }
         }
       )
     }
  });
};
