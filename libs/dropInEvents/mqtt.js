const mqtt = require('mqtt')
module.exports = (s,config,lang,app,io) => {
    if(config.mqttClient === true){
        const {
            triggerEvent,
        } = require('./events/utils.js')(s,config,lang)
        function sendPlainEvent(options){
            const groupKey = options.ke
            const monitorId = options.mid || options.id
            const subKey = options.subKey
            const endpoint = options.host
            triggerEvent({
                id: monitorId,
                ke: groupKey,
                details: {
                    confidence: 100,
                    name: 'mqtt',
                    plug: endpoint,
                    reason: subKey
                },
            },config.mqttEventForceSaveEvent)
        }
        function sendFrigateEvent(data,options){
            const groupKey = options.ke
            const monitorId = options.mid || options.id
            const subKey = options.subKey
            const endpoint = options.host
            const frigateMatrix = data.after || data.before
            const confidenceScore = frigateMatrix.top_score * 100
            const activeZones = frigateMatrix.entered_zones.join(', ')
            const shinobiMatrix = {
                x: frigateMatrix.box[0],
                y: frigateMatrix.box[1],
                width: frigateMatrix.box[2],
                height: frigateMatrix.box[3],
                tag: frigateMatrix.label,
                confidence: confidenceScore,
            }
            triggerEvent({
                id: monitorId,
                ke: groupKey,
                details: {
                    confidence: confidenceScore,
                    name: 'mqtt-'+endpoint,
                    plug: subKey,
                    reason: activeZones,
                    matrices: [shinobiMatrix]
                },
            },config.mqttEventForceSaveEvent)
        }
        function createMqttSubscription(options){
            const mqttEndpoint = options.host
            const subKey = options.subKey
            const groupKey = options.ke
            const onData = options.onData || function(){}
            const client  = mqtt.connect('mqtt://' + mqttEndpoint)
            client.on('connect', function () {
                client.subscribe(subKey, function (err) {
                    if (err) {
                        s.debugLog(err)
                        s.userLog({
                            ke: groupKey,
                            mid: '$USER'
                        },{
                            type: lang['MQTT Error'],
                            msg: err
                        })
                    }else{
                        client.on('message', function (topic, message) {
                            const data = s.parseJSON(message.toString())
                            onData(data)
                        })
                    }
                })
            })
            return client
        }
        // const onEventTrigger = async () => {}
        // const onMonitorUnexpectedExit = (monitorConfig) => {}
        const loadMqttListBotForUser = function(user){
            const groupKey = user.ke
            const userDetails = s.parseJSON(user.details);
            const mqttClientList = userDetails.mqttclient_list || []
            if(!s.group[groupKey].mqttSubscriptions)s.group[groupKey].mqttSubscriptions = {};
            const mqttSubs = s.group[groupKey].mqttSubscriptions
            mqttClientList.forEach(function(n,row){
                const mqttSubId = `${row.host} ${row.subKey}`
                const messageConversionTypes = row.type || []
                const monitorsToTrigger = row.monitors || []
                const doActions = []
                const onData = (data) => {
                    doActions.forEach(function(theAction){
                        theAction(data)
                    })
                    s.debugLog('MQTT Data',row,data)
                }
                if(mqttSubs[mqttSubId]){
                    mqttSubs[mqttSubId].end()
                    delete(mqttSubs[mqttSubId])
                }
                messageConversionTypes.forEach(function(type){
                    switch(type){
                        case'plain':
                            doActions.push(function(data){
                                 // data is unused for plain event.
                                 monitorsToTrigger.forEach(function(monitorId){
                                     sendPlainEvent({
                                         host: row.host,
                                         subKey: row.subKey,
                                         ke: groupKey,
                                         mid: monitorId
                                     })
                                 })
                            })
                        break;
                        case'frigate':
                            // https://docs.frigate.video/integrations/mqtt/#frigateevents
                            doActions.push(function(data){
                                 // this handler requires using frigate/events
                                 // only "new" events will be captured.
                                 if(data.type === 'new'){
                                     monitorsToTrigger.forEach(function(monitorId){
                                         sendFrigateEvent(data,{
                                             host: row.host,
                                             subKey: row.subKey,
                                             ke: groupKey,
                                             mid: monitorId
                                         })
                                     })
                                 }
                            })
                        break;
                    }
                })
                mqttSubs[mqttSubId] = createMqttSubscription({
                    host: row.host,
                    subKey: row.subKey,
                    ke: groupKey,
                    onData: onData,
                })
            })
        }
        const unloadMqttListBotForUser = function(user){
            const groupKey = user.ke
            const mqttSubs = s.group[groupKey].mqttSubscriptions || {}
            Object.keys(mqttSubs).forEach(function(n,mqttSubId){
                mqttSubs[mqttSubId].end()
                delete(mqttSubs[mqttSubId])
            })
        }
        s.loadGroupAppExtender(loadMqttListBotForUser)
        s.unloadGroupAppExtender(unloadMqttListBotForUser)
        // s.onEventTrigger(onEventTrigger)
        // s.onMonitorUnexpectedExit(onMonitorUnexpectedExit)
        s.definitions["Account Settings"].blocks["MQTT Client"] = {
           "evaluation": "$user.details.use_mqttclient !== '0'",
           "name": lang['MQTT Client'],
           "color": "green",
           "info": [
               {
                  "name": "detail=mqttclient",
                  "selector":"u_mqttclient",
                  "field": lang.Enabled,
                  "default": "0",
                  "example": "",
                  "fieldType": "select",
                  "possible": [
                      {
                         "name": lang.No,
                         "value": "0"
                      },
                      {
                         "name": lang.Yes,
                         "value": "1"
                      }
                  ]
               },
               {
                  "id": "mqttclient_list",
                  "fieldType": "div",
               }
           ]
        }
        //load front end js
        s.customAutoLoadTree['LibsJs'].push('bs5.mqtt.js')
    }
}
