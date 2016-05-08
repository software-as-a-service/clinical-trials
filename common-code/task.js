
var _task_fields='';
//-------------------------------------
var participant_pid=$vm.module_list['participant'][0];
var notes_pid=$vm.module_list['notes'][0];
//-------------------------------------
var site_sql_where='';
var site_array=[];
var site_filter_and_request=function(){
    var site_filter_pid=$vm.module_list['site_filter'][0];
    var sql="select List=@('Site_List') from [FORM-"+site_filter_pid+"] where S2=@S1";
    var req_data={cmd:'query_records',sql:sql,s1:$vm.user};
    $VmAPI.request({data:req_data,callback:function(res){
        if(res.records.length>0){
            var sites=res.records[0].List.replace(/\r/g,'\n').replace(/\n\n/g,'\n').replace(/\n/g,',');
            sites=sites.replace(',*','');
            sites=sites.replace('*','');
            site_array=sites.split(',');
            var sites="";
            for(var i=0;i<site_array.length;i++){
                if(sites!=="") sites+=",";
                sites+="'"+site_array[i]+"'";
            }
            if(res.records[0].List.indexOf('*')!==-1) site_sql_where='';
            else site_sql_where=" where S1 in ("+sites+")";
        }
        else{
            site_sql_where=" where S1 in ('')";
        }
        _set_req(); _request_data();
    }});
}
//-------------------------------------
_set_req=function(){
    var sql="with notes as (select PUID,NT=S1,NC=@('Color'),NRowNum=row_number() over (PARTITION BY PUID order by ID DESC) from [FORM-"+notes_pid+"] where ppid="+_db_pid+")";
    sql+=",participant as (select Site=S1,ParticipantUID=UID from [FORM-"+participant_pid+"]"+site_sql_where+" )";
    sql+=",task as (select ID,UID,PUID,S2,Site=participant.Site,Information,DateTime,Author,RowNum=row_number() over (order by ID DESC) from [FORM-"+_db_pid+"-@S1] join participant on PUID=ParticipantUID)";
    sql+="select ID,S2,UID,Site,Information,DateTime,Author,NT,NC,dirty=0, valid=1 from task left join notes on UID=notes.PUID and NRowNum=1 order by ID desc";
    var sql_n="with participant as (select Site=S1,ParticipantUID=UID from [FORM-"+participant_pid+"]"+site_sql_where+" )";
    sql_n+=" select count(ID) from [FORM-"+_db_pid+"-@S1] join participant on PUID=ParticipantUID";
    _req={cmd:'query_records',sql:sql,sql_n:sql_n,s1:'"'+$('#keyword__ID').val()+'"',I:$('#I__ID').text(),page_size:$('#page_size__ID').val()}
}
//-------------------------------------
var auto_value={};
_after_change=function(record,C){
    if(C==='Participant'){
        var uid=auto_value[record.Participant].split(',')[0]
        var site=auto_value[record.Participant].split(',').pop();
        record.participant_uid=uid;
        $("#excel__ID").handsontable("setDataAtCell", 0, 4, site);
        $("#excel__ID").handsontable("render");
    }
};
//-------------------------------------
_default_table_process=function(table){
    //-------------------------------------
    table.ID={renderer:function(instance, td, row, col, prop, value, cellProperties){
        if(value!==null && value!==undefined && value.length===6) value="#"+value;
        $(td).html("<u style='cursor:pointer;'>Form</u>");
        $(td).find('u').on('click',function(){
            var form_name=$vm.vm['__ID'].name+'_FORM';
            $vm.load_module_by_name(form_name,$vm.root_layout_content_slot,{rid:value,puid:value,ppid:participant_pid});
        })
        return td;
    }};
    //-------------------------------------
    table.S2={width:60, renderer:function(instance, td, row, col, prop, value, cellProperties){
        if(value!==null && value!==undefined && value.length===6) value="#"+value;
        if(value!=='') $(td).html("<span style='color:"+value+"'>&#x25cf;</span>");
        return td;
    }};
    //-------------------------------------
    table.NT={readOnly:true,renderer:function(instance, td, row, col, prop, value, cellProperties){
        if(_records[row]!==undefined){
            if(_records[row].UID===undefined || _records[row].UID===null){
                $(td).html('');
                return td;
            }
        }
        if(value===null || value===undefined || value==="") value='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
        var color="#000000"; if(_records[row]!==undefined) color=_records[row].NC;
        $(td).html("<u style='cursor:pointer;color:"+color+"'>"+value+"</u>");
        $(td).find('u').on('click',function(){
            var task_name=$vm.module_list[$vm.vm['__ID'].name][3];
            var visit_task=$vm.module_list[$vm.vm['__ID'].name][4];
            $vm.load_module_by_name('notes',$vm.root_layout_content_slot,{
                task_record_uid:_records[row].UID,
                task_record_pid:_db_pid,
                task_name:task_name,
                visit_task:visit_task,
                participant:_records[row].Participant,
                "sql_where":"PPID="+_db_pid+ "and PUID="+_records[row].UID,
            });
        });
        return td;
    }};
    //-------------------------------------
    table.Participant={type: 'autocomplete',trimDropdown:false,source:function (query, process){
        var sqlA="with tb as (select Item=@('Subject_Initials')+'/'+@('Gender')+'/'+@('DOB'),Value=Convert(varchar,UID)+','+@('Site') from [FORM-"+participant_pid+"])";
        sqlA+=" select top 10 Item,Value from tb where Item like '%'+@S1+'%' ";
        $vm.read_record_auto({query:query,process:process,sql:sqlA,minLength:0,callback:function(nv){auto_value=nv;}});
    }};
}
//-------------------------------------
_before_submit=function(record,dbv){    //set status color, PUID=paticipant_uid
    var flds=_task_fields.split(',');
    var J=0,K=0,N=flds.length;
    for(var i=0;i<N;i++){
        var id=flds[i].split('|').pop();
        if(id=='UID') K++;
        else if(record[id]==='' || record[id]===undefined || record[id]===null)  J++;
    }
    N=N-K;
    if(N==J) 		    dbv.S2='#FF0000';
    else if(J===0)  	dbv.S2='#00FF00';
    else 			    dbv.S2='#FFFF00';
    dbv.PPID=participant_pid;
    if(record.Participant===undefined || record.Participant===null){
        alert("No participant was selected");
        return false;
    }
    if(record.participant_uid!==undefined) dbv.PUID=record.participant_uid;
    return true;
};
//-------------------------------------
_after_submit=function(I,res,n){    //modify status color
    $("#excel__ID").handsontable("setDataAtCell", I,0,_dbv.S2);
};
//-------------------------------------
