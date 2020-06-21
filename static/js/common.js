$(document).ready(function (e) {
    $('#reg-meals').click(function(e){   
        let mealListCnt = $('#meal_list')[0].childElementCount;
        if(mealListCnt >= 10){
            alert('식단은 최대 10개까지 등록 가능합니다.');
            location.reload();
            return;
        }
    });

    $('#reg-meals').one('click',function(e){   
        getFoods();
    });
    //식단정보 가져오는 함수
    getMeals();
});

/*음식정보 가져오는 함수 */
function getFoods() {
    $.ajax({
        type: "GET",
        url: "/foods",
        data: {},
        success: function (response) {
            if(response['result']){
                let food_list = response['food_list'];
                console.log(food_list);
                $.each(food_list,function(index,food_list){
                    let result = makeFoods(index+1,food_list);
                    $('#modal-body-form').append(result);
                });
            }
        }
    });

}

function delFood(meal_date,meal_hour,meal_mins){
    if(confirm('정말로 삭제 하시겠습니까?')){
        $.ajax({
            type: "DELETE",
            url: "/meals",
            data: {"date":meal_date,
                   "hour":meal_hour,
                   "mins":meal_mins},
            success: function (response) {
                alert(response['msg']);
                location.reload();
            },
        });
    }
}
/*음식정보 가져오는 함수 */
function getMeals() {
    $.ajax({
        type: "GET",
        url: "/meals",
        data: {},
        success: function (response) {
            if(response['result']){
                let meal_list = response['meal_list'];
                $.each(meal_list,function(index,meal_list){
                    let recipientNums = meal_list.recipientNums;
                    let make_recipient="";
                    for(let i=0;i<recipientNums.length;i++){
                        make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i]+"개");
                        if(i != recipientNums.length-1){
                            make_recipient+=", ";
                        }
                    }
                    let result = makeMeals(index+1,make_recipient,meal_list);
                    $('#meal_list').append(result);
                });
            }
        }
    });
}
function makeMeals(i,make_recipient,meal_list){
            let mealHtml =`
                    <tr>
                        <th scope="row">
                            ${i}
                        </th>
                        <td>${make_recipient}</td>
                        <td class="meal_time">${meal_list.hour}:${meal_list.mins}
                        <button type="button" style="margin-left:30px" class="btn btn-danger" onclick="delFood('${meal_list.date}','${meal_list.hour}','${meal_list.mins}')">삭제</button></td>
                    </tr>`;
        return mealHtml;
}


function makeFoods(i,food){
    let foodsHtml = `<div class="form-group">
                    <label for="recipient-name" id="recipient-name${i}" class="col-form-label">${food.name}</label>
                    <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
                    <button type="button" onclick="plusBtn(${i})" id="plus_btn${i}" class="btn btn-secondary">+</button>
                    <button type="button" onclick="minusBtn(${i})" id="minus_btn${i}" class="btn btn-secondary">-</button>
                    </div>
                    <input type="text" class="form-control" onkeyup="numberCheck(this)" id="recipient-num${i}" value="0">
                    </div>`;
    return foodsHtml;
}



function addMeals() {

    /* 음식 개수 */
    let recipientNumVal = $('input[id^=recipient-num]');
    
    /* 음식 이름 */
    let recipientNameVal = $('label[id^=recipient-name]');

    let recipientNums = new Array();
    let recipientNames = new Array();
    
    /* 등록된 개수가 모두 0개 인지 체크하는 변수 */
    let zeroFlag = true;
    for(let i=0;i<recipientNumVal.length;i++){
        if(recipientNumVal[i].value == ''){
            zeroFlag = true;
            break;
        }
        //개수가 1개 이상일 경우에만 insert
        if(recipientNumVal[i].value != '0'){
            recipientNums.push(recipientNumVal[i].value);
            recipientNames.push(recipientNameVal[i].outerText);
            zeroFlag = false;
        }
    }
    if(zeroFlag){
        alert('등록 할 식단의 개수를 입력해주세요');
        return;
    }

    let hour = $('#reg-time-hour').val();
    let mins = $('#reg-time-mins').val();
    if(hour == '' || mins ==''){
        alert('시간과 분을 정확히 입력해주세요');
        $('#reg-time-hour').val('00');
        $('#reg-time-mins').val('00');
        return;
    }
    // 시간이 1자리로 들어오는 경우 
    if(hour.length == 1){
        $('#reg-time-hour').val('0'+hour);
        hour = $('#reg-time-hour').val();
    }
    // 분이 1자리로 들어오는 경우
    if(mins.length == 1){
        $('#reg-time-mins').val('0'+mins);
        mins = $('#reg-time-mins').val();
    }
    $.ajax({
        type: "POST",
        url: "/meals",
        data: {"recipientNums":recipientNums,
               "recipientNames":recipientNames,
               "hour":hour,
                "mins":mins
                },
        success: function (response) {
            if(response['result']){
                alert(response['msg']);
                location.reload();
            }
            // 에러 처리도 해주기
        },
    }); 
}
// 추후 구현
function updateMeals(){
    $.ajax({
        type: "PUT",
        url: "/meals/change",
        data: {},
        success: function (response) {
            console.log(response);
        },
    });
}
function timeHourCheck(obj) {
    let val = obj.value;
    re = /[^0-9]/gi;
    obj.value = val.replace(re, "");
    if (val >= 24 || val.length > 2) {
        alert('0~23 사이의 시간을 입력해주세요.');
        obj.value = "00";
    }
}

function numberCheck(obj) {
    let val = obj.value;
    re = /[^0-9]/gi;
    obj.value = val.replace(re, "");
    if (val >= 100 || val.length > 2) {
        alert('1~99 사이의 숫자를 입력해주세요.');
        obj.value = "0";
    }
}

function timeMinsCheck(obj) {
    let val = obj.value;
    re = /[^0-9]/gi;
    obj.value = val.replace(re, "");
    if (val >= 60 || val.length > 2) {
        alert('0~59 사이의 분을 입력해주세요.');
        obj.value = "00";
    }
}

function plusBtn(num) {
    let val = $('#recipient-num'+num).val();
    
    val = Number(val) + 1;
    
    if(val > 99){
        alert('1~99 사이의 숫자를 입력해주세요.');
        val = val - 1;
    }
    $('#recipient-num'+num).val(val);
}

function minusBtn(num) {
    let val = $('#recipient-num'+num).val();
    
    val = Number(val) - 1;
    
    if(val < 0){
        alert('1~99 사이의 숫자를 입력해주세요.');
        val = val + 1;
    }
    $('#recipient-num'+num).val(val);
}

function addExer(){
    let check1 = $('input:checkbox[id="gridCheck1"]').is(":checked");
    let check2 = $('input:checkbox[id="gridCheck2"]').is(":checked");
    let check3 = $('input:checkbox[id="gridCheck3"]').is(":checked");
    let check4 = $('input:checkbox[id="gridCheck4"]').is(":checked");
    let check5 = $('input:checkbox[id="gridCheck5"]').is(":checked");

    if(check1 || check2 || check3 || check4 || check5){
        var checkArray = new Array(check1,check2,check3,check4,check5);
        $.ajax({
            type: "POST",
            url: "/exercise",
            data: {"checkArray":checkArray
                    },
            success: function (response) {
                if(response['result']){
                    alert(response['msg']);
                    location.reload();
                }
            },
        }); 
    }else{
        alert('오늘 하실 운동을 선택 후 등록해주시기 바랍니다.');
    }

}