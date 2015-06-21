'use strict';

function CANPacket(bus, id, data, dateTime, status){
    this.bus = bus;
    this.id = id;
    this.data = data;
    this.dateTime = (typeof dateTime === "undefined")? new Date() : dateTime;
    this.status = (typeof status === "undefined")? 0 : status;
}

CANPacket.prototype.length = function() {
    return this.data.length;
};