require('babel-register')({
  cache: false // AWS is readonly
})

import 'babel-polyfill'

import book from './core'

// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse (title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: 'PlainText',
      text: output
    },
    card: {
      type: 'Simple',
      title: `SessionSpeechlet - ${title}`,
      content: `SessionSpeechlet - ${output}`
    },
    reprompt: {
      outputSpeech: {
        type: 'PlainText',
        text: repromptText
      }
    },
    shouldEndSession
  }
}

function buildResponse (sessionAttributes, speechletResponse) {
  return {
    version: '1.0',
    sessionAttributes,
    response: speechletResponse
  }
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse (callback) {
  // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {}
  const cardTitle = 'Welcome'
  const speechOutput =
    "So you don' wanna be a fat motherfucker and would like to book a training at ERS workout? What would you like to do?"
  const repromptText = 'What do you wanna do?'
  const shouldEndSession = false

  callback(
    sessionAttributes,
    buildSpeechletResponse(
      cardTitle,
      speechOutput,
      repromptText,
      shouldEndSession
    )
  )
}

function handleSessionEndRequest (callback) {
  const cardTitle = 'Session Ended'
  const speechOutput =
    'Thank you for trying the Alexa Skills Kit sample. Have a nice day!'
  // Setting this to true ends the session and exits the skill.
  const shouldEndSession = true

  callback(
    {},
    buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession)
  )
}

function createAttribute (day, time, trainer) {
  return {
    day,
    time,
    trainer
  }
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
async function bookTraining (intent, session, callback) {
  const cardTitle = intent.name

  const daySlot = intent.slots.Day
  const trainerSlot = intent.slots.Trainer
  const timeSlot = intent.slots.Time
  const day = daySlot.value
  const trainer = trainerSlot.value
  const time = timeSlot.value

  const speechOutput = `You told me that you want to book a workout on ${day} at ${time} with ${trainer}. Gonna go ahead and book for ya`
  await book(7, '20:00', 'Přibyl', true)
  console.log('Succesfully booked maybe?')
  let repromptText = ''
  let sessionAttributes = createAttribute(day, time, trainer)
  const shouldEndSession = false

  callback(
    sessionAttributes,
    buildSpeechletResponse(
      cardTitle,
      speechOutput,
      repromptText,
      shouldEndSession
    )
  )
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted (sessionStartedRequest, session) {
  console.log(
    `onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${
      session.sessionId
    }`
  )
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch (launchRequest, session, callback) {
  console.log(
    `onLaunch requestId=${launchRequest.requestId}, sessionId=${
      session.sessionId
    }`
  )

  // Dispatch to your skill's launch.
  getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
async function onIntent (intentRequest, session, callback) {
  console.log(
    `onIntent requestId=${intentRequest.requestId}, sessionId=${
      session.sessionId
    }`
  )

  const intent = intentRequest.intent
  const intentName = intentRequest.intent.name
  console.log(`intentName=`, intentName)
  // Dispatch to your skill's intent handlers
  if (intentName === 'BookTrainingIntent') {
    await bookTraining(intent, session, callback)
  } else if (intentName === 'AMAZON.HelpIntent') {
    getWelcomeResponse(callback)
  } else if (
    intentName === 'AMAZON.StopIntent' ||
    intentName === 'AMAZON.CancelIntent'
  ) {
    handleSessionEndRequest(callback)
  } else {
    throw new Error('Invalid intent')
  }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded (sessionEndedRequest, session) {
  console.log(
    `onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${
      session.sessionId
    }`
  )
  // Add cleanup logic here
}

// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
export const handler = async (event, context, callback) => {
  try {
    console.log(
      `event.session.application.applicationId=${
        event.session.application.applicationId
      }`
    )

    /**
     * Uncomment this if statement and populate with your skill's application ID to
     * prevent someone else from configuring a skill that sends requests to this function.
     */
    /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

    if (event.session.new) {
      onSessionStarted({ requestId: event.request.requestId }, event.session)
    }

    if (event.request.type === 'LaunchRequest') {
      onLaunch(
        event.request,
        event.session,
        (sessionAttributes, speechletResponse) => {
          callback(null, buildResponse(sessionAttributes, speechletResponse))
        }
      )
    } else if (event.request.type === 'IntentRequest') {
      await onIntent(
        event.request,
        event.session,
        (sessionAttributes, speechletResponse) => {
          callback(null, buildResponse(sessionAttributes, speechletResponse))
        }
      )
    } else if (event.request.type === 'SessionEndedRequest') {
      onSessionEnded(event.request, event.session)
      callback()
    }
  } catch (err) {
    callback(err)
  }
}
