var _db_pid=$vm.module_list[$vm.vm['__ID'].name][0];
$vm.vm['__ID'].db_pid=_db_pid;
$('#F__ID').validate();
//-------------------------------------
var _db_to_form=function(record){
    _default_db_to_form(record);
}
//-------------------------------------
_form_to_db=function(){
    if($('#F__ID').valid()===false){    //jQuery validation
        alert("Data validation is not passed!");
        return false;
    }
    return _default_form_to_db();
}
//-------------------------------------
var _req='';
var _row_data='';
var _dbv={};
var _before_submit='';
var _after_submit='';
//---------------------------------------------
var _default_db_to_form=function(record){
    for(name in record){
        var type=$('#'+name+'__ID').attr('type');
        switch(type){
            case 'text': $('#'+name+'__ID').val(record[name]); break;
        }
    }
}
//-------------------------------------
var _default_form_to_db=function(){
    var record={}
    $('#F__ID *').each(function(){
        if(this.name!==undefined){
            switch(this.type){
                case 'text':record[this.name.replace('__ID','')]=this.value; break;
            }
        }
    })
    return record;
}
//-------------------------------------
var _add_record=function(){
    if(_row_data!=='' && _row_data!==false){
        var req={cmd:"add_record",db_pid:_db_pid.toString(),data:_row_data,dbv:_dbv};
        $VmAPI.request({data:req,callback:function(res){
            $('#back__ID').trigger('click');
        }});
    }
}
//---------------------------------------------
var _modify_record=function(rid){
    if(_row_data!=='' && _row_data!==false){
        var req={cmd:"modify_record",rid:rid,db_pid:_db_pid.toString(),data:_row_data,dbv:_dbv};
        $VmAPI.request({data:req,callback:function(res){
            $('#back__ID').trigger('click');
        }});
    }
}
//---------------------------------------------
var _set_req=function(){
    var pid=$vm.module_list[$vm.vm['__ID'].name][0];
    var rid=$vm.vm['__ID'].op.rid;
    var sql="select ID,UID,PUID,Participant_uid=PUID,Information from [TABLE-"+pid+"] where id="+rid;
    _req={cmd:'query_records',sql:sql}
    if(rid===undefined) _req=''
}
//---------------------------------------------
var _request_data=function(){
    if(_req!==''){
        $VmAPI.request({data:_req,callback:function(res){
            if(res.records.length>0){
                var record=res.records[0];
                if(_db_to_form!=='') _db_to_form(record);
            }
        }})
    }
}
//-------------------------------------
var _entry_status=function(row_data){
    var S2='#FF0000';
    var N=0;
    var J=0;
    for(var p in row_data){
        N++;
        if(row_data[p]!==''){
            J++;
        }
    }
    if(N==J) S2='#00FF00';
    else if(J===0) S2='#FF0000';
    else S2='#FFFF00';
    return S2;
}
//---------------------------------------------
$('#save__ID').on('click', function(){
    var record=_form_to_db();
    if(record!==false){
        _row_data=record;
        var ok=true;
        if(_before_submit!==''){
            _dbv={};
            var r=_before_submit(record,_dbv);
            if(r===false){
                ok=false;
            }
        }
        if(ok===true){
            var rid=$vm.vm['__ID'].op.rid;
            if(rid===null || rid===undefined) _add_record();
            else _modify_record(rid);
        }
    }
})
//-------------------------------------
_before_submit=function(record,dbv){    //set status color, PUID=paticipant_uid
    //-------------------------------------
    dbv.S2=_entry_status(record);
    dbv.PPID=participant_pid;
    dbv.PUID=record.Participant_uid;
    if(record.Participant_uid===''){
        alert("No participant was selected");
        return false;
    }
    return true;
};
//-------------------------------------
var participant_pid=$vm.module_list['participant'][0];
var sqlA="with tb as (select Name=@('Subject_Initials')+'/'+@('Gender')+'/'+@('DOB'),Value=UID from [FORM-"+participant_pid+"])";
sqlA+=" select top 10 Name,Value from tb where Name like '%'+@S1+'%' ";
$vm.auto_input({input_id:'Participant__ID',minLength:0,sql:sqlA,callback:function(event,ui){
    $('#Participant_uid__ID').val(ui.item.value);
    ui.item.value=ui.item.label;
}})
$('#Participant_r__ID').on('click',function(){$('#Participant__ID').val('');$('#Participant_uid__ID').val('');})
//-------------------------------------
