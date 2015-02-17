# Creating a feature flag

Feature flags are the most basic tool in the Able toolbox but they can be very useful. They allow you to ship code that might not quite be ready for your massive user base but that you want to try out and get some feedback on, or be ready to switch off again if things go sideways.

Able works in browsers and node.js servers for the time being. In this post we'll focus on using the browser. The server side usage is slightly different.

Here's what we'll need to do:

- create an experiment repository
- add our repository to an Able project registry
- load the Able javascript bundle in our HTML
- use the Able API to check the feature flag
- write an experiment

## Create an experiment repository

With feature flags we want a way to control whether some piece of functionality is enabled or not *after* we've deployed our app. With Able we use an *experiment* to do this. Experiments are objects that set the values of variables at runtime that can be managed independently from the app. This allows us to control our feature flag without having to redeploy our app.

Since experiments and apps have different lifecycles its a good idea to keep them in seperate git repos. We could also use a different branch in the same repo, like gh-pages does, but for now lets create a new repo so its easier to distinguish the two.

```sh
mkdir demo && cd $_
git init
touch package.json defaults.json
```

Now we've created our git repo `demo` and created two files.

- `package.json`
  - here we give our project a name and set other metadata
  - this file must exist and have a "name" field
- `defaults.json`
  - here we set default values for our feature flags and other variables
  - this file must exist

Now lets edit the files.

### package.json

```json
{
  "name": "demo",
  "license": "MPL 2.0"
}
```

`name` is the only required field. It needs to be unique when we add it to our registry later, so we should check there to see if we have an ok name. We've also added `license` to keep the suits at bay.

### defaults.json

Our feature flag needs a name and we also want it to be off until we decide to enable it.

```json
{
  "greetingEnabled": false
}
```

Here we've picked a name for our feature flag `greetingEnabled` and chosen a default value `false`. The default value gets used when either there are no experiments that set the value, or the experiment decides that it shouldn't set a different value. We'll see this in action later.

As we add more features and start doing A/B tests in our app, we'll add new variables to this file.

Now we've got a bare bones experiment repo that doesn't do much. Later we'll add an experiment, but we've got enough to start returning default values, so we can push it up to github.

## Add our repository to an Able project registry

Now that we've got an experiment repo we need a way to add it to the Able service. The Able service hosts the experiments, manages state, and hosts the API to clients like our demo app. Many apps and experiment repos can use the same Able service. It loads experiment repositories like the one we just created via a registry. The registry is just another git repo that has links to all the experiment repos we want to use.

We'll add our experiment repo to an existing registry.

1. Open https://github.com/mozilla/able-registry-dev/blob/master/package.json in Firefox and click the 'Edit this file' icon.
  - this is the registry that our sandboxed (non-production) Able service uses
2. Add the url of your experiments repo to the `"able"` array.
3. Add a commit message, choose the option to start a pull request, and click the green button

If you don't have access to merge the pull request yourself, maybe ping `dcoates` on irc.

Once the PR is merged Able will automatically load the new experiment repo and start hosting our new experiments.

## Load the Able javascript bundle

Ok, we've got an experiment repo and the Able service is hosting it. Now we're finally ready to add the feature flag to our app!

Add a script tag to load the javascipt bundle:

```html
<script src="https://dcoates.dev.lcip.org/ab/v1/demo/experiments.bundle.js"></script>
```

The url may be slightly different depending on which Able service we choose to use. In this case we're using an [fxa-dev](https://github.com/mozilla/fxa-dev) instance. The important part of the url is `demo` which we set to the `name` in our `package.json` file. This is how Able knows which experiments to bundle.


## Use the Able API to check the feature flag

The code to check our feature flag is pretty simple. The javascript bundle creates a global named `able` that provides the API. Adding to our previous snippet we can check the flag.

```html
<script src="https://dcoates.dev.lcip.org/ab/v1/demo/experiments.bundle.js"></script>
<script>
  if (able.choose('greetingEnabled')) {
    console.log('hello, world!')
  }
</script>
```

We use the `choose` function to get the value of the flag. It will either return a value set by an experiment or the default value we set in `defaults.json`. Since we don't have any experiments yet it will return the default, `false`.

This snippet is totes boring but it should actually work. If we load a page with this in the browser and pull up a javascript console it *won't* have "hello, world!" logged... *yet*. Which for now is what we want, that "feature" is not enabled.

That's all we have to do on the app side, the flag is now wired up! From here we could either change the default to `true` or create an experiment. Lets do the latter.

## Write an experiment

Alright, lets finally add that experiment.

There are a bunch of ways we can design an experiment for a feature flag. We can enable it for a certain percentage of users, or based on specific attributes of the `able.subject`, or during a specific time window, or almost anything we want. We've got a lot of flexibility. Designing experiments is a deep topic. When they're documented we'll link to the full details, but in this case we'll keep it pretty simple, lets do a "release experiment".

We're pretty confident that our greeting feature is solid, but we want to release it slowly over the course of a few days.

Create a file named `greeting-release.js` in our experiments repo that looks like this:

```js
module.exports = {
  name: 'greeting feature release',
  conclusion: {
    greetingEnabled: true
  },
  release: {
    startDate: '2015-01-27',
    endDate: '2015-01-30'
  }
}
```

First we've got a `name` which should be a short descriptive string. Next a `conclusion` which sets our flag to be enabled. Then we've got a `release` which sets the start and end dates for when the conclusion will go into effect. Between the `startDate` and `endDate` a gradually increasing number of clients will get the conclusion value instead of the default value. After the `endDate` everyone will be getting the conclusion value and the feature is enabled for everyone.

When we push the experiment to our github repo the Able service will pick it up and our release will proceed :)

For some examples of other types of experiments check out the [cookbook](cookbook.md).

---

Ok, that was kind of a lot of stuff for one feature flag, but now we're set up to do any number of other experiments pretty easily.

