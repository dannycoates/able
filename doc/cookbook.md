# Experiment Recipes


## Release a new feature

```js
{
  name: 'best feature ever',
  conclusion: {
    bestFeatureEnabled: true
  },
  endDate: '2015-01-15'
}
```

## Release a new feature slowly

```js
{
  name: 'hot feature',
  conclusion: {
    hotFeatureEnabled: true
  },
  release: {
    startDate: '2015-01-01',
    endDate: '2015-01-05'
  }
}
```

## Beta test a feature

```js
{
  name: 'p-cool feature',
  startDate: '2015-01-15',
  subjectAttributes: ['userAgent'],
  independentVariables: ['pCoolFeatureEnabled'],
  eligibilityFunction: function (subject) {
    // let firefox 36 users use this feature. IRL you'll want a better check
    return subject.userAgent.indexOf('Firefox/36') > -1
  },
  groupingFunction: function (subject) {
    // all eligible participants get enabled
    return {
      pCoolFeatureEnabled: true
    }
  }
}
```

## A/B test a setting

```js
{
  name: 'blue or green button',
  hypothesis: 'blue will have more clicks',
  startDate: '2014-12-15',
  subjectAttributes: ['sessionId'],
  independentVariables: ['buttonColor'],
  eligibilityFunction: function (subject) {
    // a random sampling of 10% of sessions will be in the experiment
    return this.bernoulliTrial(0.1, subject.sessionId)
  },
  groupingFunction: function (subject) {
    // 50% of participants will see blue, the rest green
    return {
      buttonColor: this.uniformChoice(['blue', 'green'], subject.sessionId)
    }
  }
}
```

## Abort an experiment

Set and `endDate` with no `conclusion`

```js
{
  name: 'blue or green button',
  hypothesis: 'blue will have more clicks',
  startDate: '2014-12-15',
  endDate: '2014-12-16',
  subjectAttributes: ['sessionId'],
  independentVariables: ['buttonColor'],
  eligibilityFunction: function (subject) {
    // a random sampling of 10% of sessions will be in the experiment
    return this.bernoulliTrial(0.1, subject.sessionId)
  },
  groupingFunction: function (subject) {
    // 50% of participants will see blue, the rest green
    return {
      buttonColor: this.uniformChoice(['blue', 'green'], subject.sessionId)
    }
  }
}
```
