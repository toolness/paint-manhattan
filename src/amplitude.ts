const AMPLITUDE_API_KEY = "40355a927e83f7e810a4a52d25d21ace";

type AmplitudeInterface = typeof import("../vendor/amplitude");

type AmplitudeEvent = {
  name: 'Game started',
  showStreetSkeleton: boolean,
  showStreetsInNarrativeOrder: boolean,
} | {
  name: 'Street painted',
  streetName: string,
  missedAtLeastOnce: boolean,
} | {
  name: 'Game won',
  streetsPainted: number,
  finalScore: number,
} | {
  name: 'Home page viewed',
} | {
  name: 'Debug page viewed',
};

function getAmplitude(): AmplitudeInterface|null {
  if (!window.amplitude) {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('noamplitude') === 'on') {
      return null;
    }
    initAmplitude();
    window.amplitude.getInstance().init(AMPLITUDE_API_KEY);
  }
  return window.amplitude;
}

export function logAmplitudeEvent(event: AmplitudeEvent) {
  const {name, ...data} = event;
  const amplitude = getAmplitude();

  if (amplitude) {
    const identify = new amplitude.Identify();
    const instance = amplitude.getInstance();

    instance.logEvent(name, data);

    if (event.name === 'Street painted') {
      identify.add('Streets painted', 1);
      if (!event.missedAtLeastOnce) {
        identify.add('Flawless streets painted', 1);
      }
    } else if (event.name === 'Game started') {
      identify.add('Games started', 1);
    } else if (event.name === 'Game won') {
      identify.add('Games won', 1);
    }

    instance.identify(identify);
  }
}

function initAmplitude() {
  eval(`(function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
  ;r.type="text/javascript"
  ;r.integrity="sha384-vYYnQ3LPdp/RkQjoKBTGSq0X5F73gXU3G2QopHaIfna0Ct1JRWzwrmEz115NzOta"
  ;r.crossOrigin="anonymous";r.async=true
  ;r.src="https://cdn.amplitude.com/libs/amplitude-5.8.0-min.gz.js"
  ;r.onload=function(){if(!e.amplitude.runQueuedFunctions){
  console.log("[Amplitude] Error: could not load SDK")}}
  ;var i=t.getElementsByTagName("script")[0];i.parentNode.insertBefore(r,i)
  ;function s(e,t){e.prototype[t]=function(){
  this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
  var o=function(){this._q=[];return this}
  ;var a=["add","append","clearAll","prepend","set","setOnce","unset"]
  ;for(var u=0;u<a.length;u++){s(o,a[u])}n.Identify=o;var c=function(){this._q=[]
  ;return this}
  ;var l=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
  ;for(var p=0;p<l.length;p++){s(c,l[p])}n.Revenue=c
  ;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId"]
  ;function v(e){function t(t){e[t]=function(){
  e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}
  for(var n=0;n<d.length;n++){t(d[n])}}v(n);n.getInstance=function(e){
  e=(!e||e.length===0?"$default_instance":e).toLowerCase()
  ;if(!n._iq.hasOwnProperty(e)){n._iq[e]={_q:[]};v(n._iq[e])}return n._iq[e]}
  ;e.amplitude=n})(window,document);`);
}