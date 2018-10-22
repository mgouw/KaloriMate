/*
A method that accepts a picture and returns its nutritional value
*/

var allergens = ['milk', 'eggs', 'peanuts', 'tree nuts', 'soy', 'wheat', 'fish', 'shellfish', 'gluten'];

module.exports = function(controller) {
  controller.on('direct_message', function(bot, message) {
    
    bot.startConversation(message, function(err, convo) {
      
      if (message.data.files) {
        
        if(message.text != null){
          bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
        }
        
        bot.retrieveFileInfo(message.data.files[0], function(err, file_info) {
                    
          bot.retrieveFile(message.data.files[0], function(err, file) {
                        
              // <clarifai> starts here
            
              // Require the client
              const Clarifai = require('clarifai');

              // instantiate a new Clarifai app passing in your api key.
              const clarafai = new Clarifai.App({
                apiKey: process.env.apiKey
              });

              // predict the contents of an image by passing in a SAMPLE url
            clarafai.models.predict(Clarifai.FOOD_MODEL, {base64: Buffer.from(file, 'binary').toString('base64')}).then(
              function(response) {
                  
                const WolframAlphaAPI = require('wolfram-alpha-api');
                const waApi = WolframAlphaAPI(process.env.wolframApiKey);
                  
                convo.say("calculating...");
                  
                for(let i = 0; i < 3; i++) {
                waApi.getFull({
                  input: response.outputs[0].data.concepts[i].name + ' nutrition facts',
                  appid: process.env.wolframApiKey,
                })
                  .then((queryresult) => {
                    if (queryresult.success == true) {
                      bot.reply(message,{text: response.outputs[0].data.concepts[i].name, 
                                        files:[queryresult.pods[1].subpods[0].img.src]});
                    }
                  }).catch(console.error)
                }
                  
                for(let j = 0; j < allergens.length; j++) {
                  for(let k = 0; k < response.outputs[0].data.concepts.length; k++) {
                    if(response.outputs[0].data.concepts[k].name.toLowerCase() == allergens[j]) {
                      convo.say("This contain allergen: " + response.outputs[0].data.concepts[k].name);
                    }
                  }
                }
              },
              function(err) {
                // json error
                console.log(err);
              }
            ); //end predict
          });
        });
      }
    }); //end startConversation
  });
}