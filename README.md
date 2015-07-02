# George the memebot

## Deploying George on Bluemix

Note that the first two steps were automatically done for you if you used the
_Deploy to Bluemix_ button. You still need to [train George](#how-to-train-your-robot),
though.

### Create the natural language classifier instance

```
$ cf create-service natural_language_classifier free george-classifier
```

### Deploy your Bluemix application

Assuming you want to call your app `my-own-george`:

```
$ cf push my-own-george
```

This will make your app available at http://my-own-george.mybluemix.net (or
http://my-own-george.eu-gb.mybluemix.net if you're using the UK region).

But until the classifier is trained, George won't be able to answer any questions.

### How to train your robot

First you need to retrieve the credentials for the classifier service you
created above. You can find them on the Bluemix console if you look hard
enough, or you can find them by dumping the application's environment with this
command (substituting `my-own-george` with your app name, of course):

```
$ cf env my-own-george
…
{
 "VCAP_SERVICES": {
  "natural_language_classifier": [
   {
    "credentials": {
     "password": "ppppppppppp",
     "url": "https://gateway.watsonplatform.net/natural-language-classifier-experimental/api",
     "username": "uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu"
    },
…
```

Armed with these `username` and `password`, you can now create a classifier instance, by
using the `corpus.json` provided with George:

```
$ curl -Ss -u uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu:ppppppppppp \
    -H "Content-Type:application/json" \
    -d @corpus.json \
    https://gateway.watsonplatform.net/natural-language-classifier-experimental/api/v1/classifiers
{
  "classifier_id": "ABCDEF-nlc-123",
  "name": null,
  "created": "2015-06-24T12:56:58.555Z",
  "url": "https://gateway.watsonplatform.net/natural-language-classifier-experimental/api/v1/classifiers/ABCDEF-nlc-123",
  "status": "Training",
  "status_description": "The classifier instance is in its training phase, not yet ready to accept classify requests"
}
```

As you can see, the classifier is training itself. It will stay like this for a
few minutes.

However, now that we have a classifier ID (`ABCDEF-nlc-123` above), we don't have to
wait to configure our application to use it:

```
$ cf set-env my-own-george CLASSIFIER_ID ABCDEF-nlc-123
$ cf restage my-own-george
```

Once the classifier is ready (which you can easily check by accessing its full
URL as returned above), George should be ready to answer questions.

Anytime you change `corpus.json`, you will have to train a new classifier instance, and
update your app's `CLASSIFIER_ID` environment variable accordingly.

See [here](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/apis/#!/natural-language-classifier/classify_0)
for the full Natural Language Classifier API reference.
