/*
TODO: 
- import/ export as ICS calender file -> https://github.com/nwcell/ics.js                       DONE
- Django Anschluss um daten in DB zu speichern (Benutzer definiert und Geräteübergreifend)
    -  Readers view (no edition possible)
    - QR code to readers View  -> https://davidshimjs.github.io/qrcodejs/
- Icons
 
- Daten local (XML export/import) speichern um die Einstellungen schnell auf andere PCs zu spielen

*/


// -------------------- helper functions

function ts2date(ts){ //timestamp 
    var t = new Date(Math.round(ts));
    //console.log("Date: " + t.getTime());
    return t.getUTCFullYear() + '-' + addZero(t.getUTCMonth()+1) + '-' + addZero(t.getUTCDate());
}

function ts2time(ts){ //timestamp
    var t = new Date((ts));  // + settings.timezone

    if(ts <= 0){
        return "";
    }

    if(ts < 8640000){ //ts lower than 24h 
        return addZero(t.getUTCMinutes()) + ':'+ addZero(t.getUTCSeconds()); //show als laptime with millis
    }
    //console.log("Date: " + t.getTime());
    return addZero(t.getUTCHours()) + ':' + addZero(t.getUTCMinutes());
}

function date2ts(date){ //yyyy-mm-dd to timestamp 
    return Math.round(Date.parse(date));
}

function time2ts(time){ //hh:mm to timestamp 
    var now = new Date();
    //var userOffset = now.getTimezoneOffset()+60;
    //console.log(settings.timezone);
    //console.log("ts: " + time + " = " + Date.parse("1970-01-01 " + time));
    return Math.round(Date.parse("1970-01-01 " + time ));// + userOffset*60 ; // + settings.timezone
}

function addZero(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}

// ---- timezone-correct helpers (DST-aware) ----
function dateTime2ts(dateStr, timeStr){ // "yyyy-mm-dd" + "hh:mm" -> UTC ms timestamp at that local time
    if (!dateStr || !timeStr) return 0;
    return new Date(dateStr + "T" + timeStr).getTime();
}

function ts2dateLocal(ts){ // UTC ms -> "yyyy-mm-dd" in local time
    var t = new Date(ts);
    return t.getFullYear() + '-' + addZero(t.getMonth()+1) + '-' + addZero(t.getDate());
}

function ts2timeLocal(ts){ // UTC ms -> "hh:mm" in local time
    var t = new Date(ts);
    return addZero(t.getHours()) + ':' + addZero(t.getMinutes());
}

function compareTime(a,b) { //function to compare the starttime for the list SORT function
    if (a.startTime < b.startTime)  //a < b
      return -1;
    if (a.startTime > b.startTime)  //a > b
      return 1;
    return 0;                       // a = b
}

function showCountdown(target){ //return a String with the countdown time
    var t = new Date();
    var offset = 0;// t.getTimezoneOffset() * 60 * 1000;
    var restTime = target - (t.getTime() - offset + settings.offset);
    if (restTime < 0){
        return "now";
    }
    var t = new Date(restTime);

    var out =  addZero(t.getUTCSeconds());

    if(restTime > 60*1000){    //add minutes
        out = addZero(t.getUTCMinutes()) + ":" + out;
    }
    if (restTime > 60*60*1000){ //add hours
        out = addZero(t.getUTCHours()) + ":" + out;
    }
    if (restTime > 24*60*60*1000){ //show Days
        var days = Math.floor(t/(24*60*60*1000));
        out = days;
        if (days > 1) {
            out = out + " Days ";
        }else{
            out = out + " Day ";
        }
        out = out + addZero(t.getUTCHours()-1) + ":" + addZero(t.getUTCMinutes());
    }

    //return "12:22:33"
    return out;
}

// is the same like ts2time
function showTime(target, showDateStr=0){   //return Time 12:12 or 1 Day 10:02
    var t   = new Date(target);
    var out = "";
    //var now = t.getTime();
    out = addZero(t.getHours()) + ":" + addZero(t.getMinutes()); //display time
    
    //correction for the duration time
    if(t.getTime() < 864000000){ //for countdown  (ts < 10days)
        //showDateStr = 0;
        out = addZero(t.getUTCHours()) + ":" + addZero(t.getUTCMinutes());
    }
    var today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0,0,0);
    //is the target time not today? add Days
    if(showDateStr && (t.getTime() < today.getTime() || t.getTime() > today.getTime()+864000000)){ //add days
        //out += " " + addZero(t.getDay()) + ":" + addZero(t.getMonth());
        out = showDate(target) + " " + out;
    }
    
    return out;
}

// is the same like ts2date
function showDate(target){  //returns the Date of a timestamp
    var t   = new Date(target);
    var out = "";

    out = addZero(t.getDate()) + "." + addZero(t.getMonth()+1) + "." + t.getFullYear();

    return out;
}

function showDuration(dura){ //ts ohne ms  returns Min
    var min = Math.round(dura / 60 / 1000);
    return min
}

// ------------------- list functions inputs ------------------

function edit(id, copy, type){  //edit & copy -> load the Event details to the input field
    document.getElementById("Ftype").options.item(type).selected = true;
    var ev = (type == 0) ? race_events[id] : orga_events[id];
    document.getElementById("Fname").value = ev.name;
    document.getElementById("FstartDate").value = ts2dateLocal(ev.startTime);
    document.getElementById("FstartTime").value = ts2timeLocal(ev.startTime);
    document.getElementById("Fduration").value = Math.round(ev.duration/60/1000);
    console.log("Edit Item: " + id + " - " + ev.name);
    if (copy == 0) {del(id,type);} //delete the selectet item
    showEvents(type);
}

function del(id, type){
    if(type == 0){  //type race
        console.log("delete Item: " + id + " - " + race_events[id].name);
        race_events.splice(id, 1);
    }
    if(type == 1){  //type orga
        console.log("delete Item: " + id + " - " + orga_events[id].name);
        orga_events.splice(id, 1);
    }
    showEvents(type);
}

function save(){
    var type = document.getElementById("Ftype");
    type = type.selectedIndex;  //0 = track; 1 = orga
    var name = document.getElementById("Fname").value;
    var date = document.getElementById("FstartDate").value;
    var time = document.getElementById("FstartTime").value;
    var dura = document.getElementById("Fduration").value;
    if (dura < 0){dura = 0}
    console.log("add Item: " + type + " " +name+ ' ' + dateTime2ts(date,time) + ' ' +dura);
    addEvent(name , dateTime2ts(date,time), dura*60*1000, type);
    //showRaceEvents();
    startTime(0);//update display
}

function addSamples(){
    //race Events
    addEvent("free Practice 1", now.getTime()+ 15*60*1000, 60*60*1000,0);    //future event
    addEvent("free Practice 2", now.getTime()+165*60*1000, 60*60*1000,0);    //new future
    addEvent("Quali"          , now.getTime()+360*60*1000, 25*60*1000,0);    //event in the past
    //orga Events
    addEvent("Driver Briefing", now.getTime()+ 60*60*1000, 60*60*1000,1);     //Orga Event
}

function reset(){   //reset Button
    var r = confirm("Delete all events?");
    if (r == true) {
        race_events = [];
        orga_events = [];
        settings.offset = 0;
        //saveDataLocal();
        showEvents(0);
        showEvents(1);   
    }
}

function changeOffset(){    
    var offset = document.getElementById("Toffset").value;
    settings.offset = offset*60*1000; //minutes to secounds    
    console.log("change Offset: " + settings.offset + " min");
    saveDataLocal();
    startTime(0); //update Screen
}

function changeTeamname(){
    var teamname = document.getElementById("Fteamname").value;
    settings.teamname = teamname;
    document.getElementById("team_name").innerHTML = teamname;
    console.log("change Name to: " + teamname + "");
    saveDataLocal();
}

function Event(name, startTime, duration) { //Event object definition
    this.name = name;
    this.startTime = startTime;
    this.duration = duration;
}

function addEvent(name, startTime, duration, type) { //timestamp ohne ms, duration s
    var event = new Event(name, Math.round(startTime), Math.round(duration));
    if(type == 0){
        race_events.push(event);
        //console.log("add Orga: " + event.name);
        race_events.sort(compareTime);  //sort the list 
    }
    if(type == 1) {
        orga_events.push(event);
        //console.log("add Race: " + event.name);
        orga_events.sort(compareTime);  //sort the list        
    }
    showEvents(type);
};

function showEvents(type){  //type 0 = Race; 1=Orga
    var id = 0;
    if (type == 0) {    //race Events
        document.getElementById('raceEvents').innerHTML = "";
        for (item in race_events) {
            var event = race_events[item];
            document.getElementById('raceEvents').innerHTML += '<button onclick="edit('+ id +',1,'+type+')" type="button" class="btn btn-primary btn-sm" title="copy this event">copy</button> <button onclick="edit('+ id +',0,'+type+')" type="button" class="btn btn-warning btn-sm" title="edit this event">edit</button> <button onclick="del('+ id +','+type+')" type="button" class="btn btn-danger btn-sm" title="delete this event">del</button> ' + showEvent(event) + '  <br>';
            id++;
        }
        if (id == 0){
            document.getElementById('raceEvents').innerHTML += 'no Events in List'
        }
    }
    if (type == 1) {    //orga Events
        document.getElementById('orgaEvents').innerHTML = "";
        for (item in orga_events) {
            var event = orga_events[item];
            document.getElementById('orgaEvents').innerHTML += '<button onclick="edit('+ id +',1,'+type+')" type="button" class="btn btn-primary btn-sm" title="copy this event">copy</span></button> <button onclick="edit('+ id +',0,'+type+')" type="button" class="btn btn-warning btn-sm" title="edit this event">edit</button> <button onclick="del('+ id +','+type+')" type="button" class="btn btn-danger btn-sm" title="delete this event">del</button> ' + showEvent(event) + '  <br>';
            id++;
        }
        if (id == 0){
            document.getElementById('orgaEvents').innerHTML += 'no Events in List';
        }
    }
    saveDataLocal();
}

function nextEventID(type){ //return the ID of the next or current active Event
    var now = new Date();
    now = Math.round(now.getTime() + settings.offset); //get the current timestamp without millisecounds
    var id = 0;
    //console.log("NOW: " + now);
    var events = race_events.slice();
    if(type == 1){
        events = orga_events.slice();
    }
    for (item in events) {
        var event = events[item];
        //console.log("Item: " + event.startTime + " - " + event.name);;
        if (event.startTime + event.duration >= now){
            return id;
        }
        id ++;
    }
    return -1;
}

function showEvent(event){
    var out = "";
    out += "" + showDate(event.startTime);
    out += " - " + showTime(event.startTime); 
    out += " (" + showTime(event.duration) + ") ";
    out += event.name + "";
    return out;
}

function showNextEvents(type, elements=1){
    var id = 0;
    var startId = nextEventID(type);
    //document.getElementById('raceNextEvents').innerHTML = 'Next Events: <br>';
    document.getElementById('raceNextEvents').innerHTML = "";
    if (type == 0 && startId >= 0){
        for (item in race_events){
            var event = race_events[item];
            if(startId <= id && startId + elements-1 >= id){
                var line = "<tr><td>"+event.name+"</td><td>"+showDuration(event.duration)+"min</td><td>"+showTime(event.startTime,1)+"</td></tr>"; //<td>"+showCountdown(event.startTime)+"</td>
                document.getElementById('raceNextEvents').innerHTML += line;//showEvent(event) + '<br>';
            }
            id++;
        }
    }else{
        //TODO show Orga Events
    }
}

function saveDataLocal(){
    if (typeof(Storage) !== "undefined") {
        //save settings as JSON
        localStorage.setItem("settings", JSON.stringify(settings));
        localStorage.setItem("race_events", JSON.stringify(race_events));
        localStorage.setItem("orga_events", JSON.stringify(orga_events));
        return true;
    } else {
        // Sorry! No Web Storage support..
        console.log("Sorry! No Web Storage support..");
        return false;
    }
}

function loadDataLocal(){
    if (typeof(Storage) !== "undefined") {
        // load settings as JSON
        if (localStorage.settings)      {settings = JSON.parse(localStorage.settings);}
        if (localStorage.race_events)   {race_events = JSON.parse(localStorage.race_events);}
        if (localStorage.orga_events)   {orga_events = JSON.parse(localStorage.orga_events);}
        return true;
    } else {
        // Sorry! No Web Storage support..
        console.log("Sorry! No Web Storage support..");
        return false;
    }
}


//-------------------------- Excel import ------------------------------------------

function parseExcelDateField(val){
    if (val instanceof Date) {
        //SheetJS with cellDates:true returns Date objects built from LOCAL components,
        //so we must read them back with local getters (not getUTC*).
        return val.getFullYear() + '-' + addZero(val.getMonth()+1) + '-' + addZero(val.getDate());
    }
    if (typeof val === 'number' && typeof XLSX !== 'undefined' && XLSX.SSF) {
        var o = XLSX.SSF.parse_date_code(val);
        if (o) return o.y + '-' + addZero(o.m) + '-' + addZero(o.d);
    }
    var s = String(val == null ? '' : val).trim();
    if (!s) return null;
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + '-' + addZero(parseInt(m[2],10)) + '-' + addZero(parseInt(m[3],10));
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) {
        var d = parseInt(m[1],10), mo = parseInt(m[2],10), y = parseInt(m[3],10);
        if (y < 100) y = y < 50 ? 2000+y : 1900+y;
        return y + '-' + addZero(mo) + '-' + addZero(d); //assume dd/mm/yyyy (Italian)
    }
    var fallback = new Date(s);
    if (!isNaN(fallback.getTime())) return fallback.getFullYear() + '-' + addZero(fallback.getMonth()+1) + '-' + addZero(fallback.getDate());
    return null;
}

function parseExcelTimeField(val){
    if (val instanceof Date) {
        //local getters: SheetJS builds the Date from local components
        return addZero(val.getHours()) + ':' + addZero(val.getMinutes());
    }
    if (typeof val === 'number') { //fraction of a day
        var totalMin = Math.round(val * 24 * 60);
        var hh = Math.floor(totalMin / 60) % 24;
        var mm = totalMin % 60;
        return addZero(hh) + ':' + addZero(mm);
    }
    var s = String(val == null ? '' : val).trim();
    var m = s.match(/^(\d{1,2}):(\d{2})/);
    if (m) return addZero(parseInt(m[1],10)) + ':' + addZero(parseInt(m[2],10));
    return null;
}

function parseExcelTypeField(val){
    var s = String(val == null ? '' : val).trim().toLowerCase();
    if (s === 'track event' || s === 'track' || s === 'race' || s === '0') return 0;
    if (s === 'orga event' || s === 'orga' || s === 'organisation' || s === '1') return 1;
    return -1;
}

function importExcel(file){
    if (!file) return;
    importExcelFromArrayBuffer = function(){}; // (placeholder for clarity, not used)
    var reader = new FileReader();
    reader.onload = function(e){
        importExcelArrayBuffer(e.target.result, {source: 'file: ' + file.name, alertOnSuccess: true});
        var fi = document.getElementById('FexcelFile');
        if (fi) fi.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// Shared parser used by both file import and remote auto-fetch
function importExcelArrayBuffer(arrayBuffer, opts){
    opts = opts || {};
    if (typeof XLSX === 'undefined') {
        if (opts.alertOnSuccess) alert('XLSX library not loaded.');
        return false;
    }
    try {
        var data = new Uint8Array(arrayBuffer);
        var wb = XLSX.read(data, {type: 'array', cellDates: true});
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(sheet, {raw: true, defval: ''});

        race_events = [];
        orga_events = [];

        var imported = 0, errors = [];
        rows.forEach(function(row, idx){
            var rowNum = idx + 2;
            var type = parseExcelTypeField(row['Type'] || row['type']);
            var name = String(row['Name'] || row['name'] || '').trim();
            var dateStr = parseExcelDateField(row['Date'] || row['date']);
            var timeStr = parseExcelTimeField(row['Time'] || row['time']);
            var dura = parseInt(row['Duration [min]'] || row['Duration'] || row['duration'] || 0, 10);
            if (isNaN(dura) || dura < 0) dura = 0;

            if (type === -1) { errors.push('Row ' + rowNum + ': unknown Type'); return; }
            if (!name)       { errors.push('Row ' + rowNum + ': missing Name'); return; }
            if (!dateStr)    { errors.push('Row ' + rowNum + ': invalid Date'); return; }
            if (!timeStr)    { errors.push('Row ' + rowNum + ': invalid Time'); return; }

            addEvent(name, dateTime2ts(dateStr, timeStr), dura*60*1000, type);
            imported++;
        });

        saveDataLocal();
        startTime(0);

        if (opts.alertOnSuccess) {
            var msg = 'Imported ' + imported + ' event(s) from ' + (opts.source || 'file') + '. Existing events were replaced.';
            if (errors.length > 0) msg += '\n\nSkipped:\n' + errors.join('\n');
            alert(msg);
        } else {
            console.log('Imported ' + imported + ' event(s) from ' + (opts.source || 'remote') + '. Skipped: ' + errors.length);
        }
        return true;
    } catch (err) {
        console.error('importExcelArrayBuffer error:', err);
        if (opts.alertOnSuccess) alert('Error importing Excel: ' + err.message);
        return false;
    }
}

// Auto-fetch the team Excel from the server (same-origin path)
// Set REMOTE_EXCEL_URL to where you commit the file in your repo.
var REMOTE_EXCEL_URL = 'events/Events.xlsx';

function refreshRemoteEvents(showAlert){
    if (typeof fetch === 'undefined') {
        if (showAlert) alert('Your browser does not support fetch().');
        return;
    }
    // cache-busting query string so we always check for updates
    var url = REMOTE_EXCEL_URL + '?t=' + Date.now();
    fetch(url, {cache: 'no-cache'})
        .then(function(resp){
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        })
        .then(function(buf){
            var ok = importExcelArrayBuffer(buf, {source: 'server', alertOnSuccess: !!showAlert});
            if (ok && !showAlert) console.log('Auto-fetched events from ' + REMOTE_EXCEL_URL);
        })
        .catch(function(err){
            console.warn('refreshRemoteEvents failed:', err.message);
            if (showAlert) alert('Could not fetch ' + REMOTE_EXCEL_URL + ':\n' + err.message + '\n\n(Using locally stored events.)');
        });
}

// Try once on startup, but only when running over http(s) - not file://
// Also skip if the user has unsaved local-only events from manual edits.
window.addEventListener('load', function(){
    if (location.protocol.startsWith('http')) {
        refreshRemoteEvents(false);
    }
});


//-------------------------- time loop ------------------------------------------

function startTime(update=1) {
    var today = new Date();
    var offset = today.getTimezoneOffset()*60*1000
    //var offset = 0; //[s] to add a offset to the current time

    var now = today.getTime() - offset + settings.offset;
    var today = new Date(now); //current time + offset ;) 

    var h = today.getUTCHours();
    var m = today.getUTCMinutes();
    var s = today.getUTCSeconds();

    //add a 0 to numbers under 10
    m = addZero(m);
    s = addZero(s);
    
    document.getElementById('date').innerHTML = showDate(today)//d + "." + mo + "." + y;
    document.getElementById('time').innerHTML = h + ":" + m;
    
    document.getElementById("current_countdown").style.backgroundColor = "";
    document.getElementById("current_orga_event").style.backgroundColor = "";
    document.getElementById("current_countdown").classList.remove("blink");

    var nextRaceID = nextEventID(0);

    if (race_events.length == 0){ //no items in List
        document.getElementById('current_event').innerHTML = "";
        document.getElementById('current_countdown').innerHTML = h + ":" + m + ":" + s;
    }else if (nextRaceID >= 0){ //found a next ID
        var event = race_events[nextRaceID];
    
        if(event.startTime-offset < now){ //Event is active - countdown to end of event
            document.getElementById('current_event').innerHTML = event.name;
            document.getElementById('current_countdown').innerHTML = showCountdown(event.startTime + event.duration);
            document.getElementById("current_countdown").style.backgroundColor = "green";
        }else{ //Countdown to Eventstart
            document.getElementById('current_event').innerHTML = event.name + "";
            document.getElementById('current_countdown').innerHTML = showCountdown(event.startTime);
            if(event.startTime-offset-now < 10*60*1000){
                document.getElementById("current_countdown").style.backgroundColor = "red";
            }
            if(event.startTime-offset-now < 5*60*1000){
                document.getElementById("current_countdown").className += " blink";
            }
            
        }
    }else{  //no Events in the future
        document.getElementById('current_event').innerHTML = "";
        document.getElementById('current_countdown').innerHTML = h + ":" + m + ":" + s;
    }

    //ORGA EVENT
    var nextOrgaId = nextEventID(1);
    if(nextOrgaId >= 0){
        var event = orga_events[nextOrgaId]
        document.getElementById('current_orga_event').innerHTML = showTime(event.startTime) + " - " + event.name  + " - " + showCountdown(event.startTime);
        if(event.startTime-offset-now < (10*60+1)*1000){
            document.getElementById("current_orga_event").style.backgroundColor = "red";
        }
    }else{
        document.getElementById('current_orga_event').innerHTML = "";
    }

    showNextEvents(0,2);

    if (update){var t = setTimeout(startTime, 200);} //refresh every 200 ms
}


var now = new Date();
var settings = { offset:0, teamname:"-Teamname-", timezone:0} //timeoffset in min
//settings.timezone = now.getTimezoneOffset()+60;
var race_events = [];       //Event list for Event Items
var orga_events = [];       //Event list for orga Items

//console.log(settings.timezone);

//add some Test Events
if(!loadDataLocal() || (race_events.length == 0 && orga_events.length == 0)){
    addSamples();
}

//update form
document.getElementById('FstartDate').value = ts2dateLocal(now.getTime());
document.getElementById('Toffset').value = settings.offset/60/1000;
document.getElementById('team_name').innerHTML = settings.teamname;
document.getElementById('Fteamname').value = settings.teamname;

showEvents(0);
showEvents(1);


//hide the mouse if mous is not moving
var justHidden;
var j;
$(document).mousemove(function() {
    if (!justHidden) {
        justHidden = false;
        //console.log('move');
        clearTimeout(j);
        //$('html').css({cursor: 'default'});
        $("body").css('cursor', 'default');
        j = setTimeout(hide, 5000);
    }
});

function hide(){
    $("body").css('cursor', 'none');
}


//var now = new Date();
//var userOffset = now.getTimezoneOffset();
//console.log(userOffset);
//console.log(settings.timezone);

//debug output
//var nextId = nextEventID(0);
//console.log(race_events);
//console.log("Next Event ID:" + nextId);
//console.log(race_events[nextId].startTime+ "  " + now.getTime()/1000 + " " + (race_events[nextId].startTime -now.getTime()/1000) );






