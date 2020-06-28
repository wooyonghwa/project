$(document).ready(function (e) {
    $('#reg-meals').click(function (e) {
        getFoods();
        //시간과 숫자 초기화 함수
        initNumbers();
        $('#add-meal-btn').show();
        $('#chg-meal-btn').hide();
        let mealListCnt = $('#meal_list')[0].childElementCount;
        if (mealListCnt >= 10) {
            alert('식단은 최대 10개까지 등록 가능합니다.');
            location.reload();
            return;
        }
    });

    // $('#reg-meals').one('click', function (e) {
    //     getFoods();
    // });
    $('#ModalReg').on('hide.bs.modal', function () {
        //해당 날짜로 다시 조회해서 그리는거 
        if ($('#chg-date').val() != '') {
            reDrawPastMeal($('#chg-date').val().split(':')[0]);
            $('#chg-date').val('');
        }
    });
    //식단정보 가져오는 함수
    getMeals();

});
function initNumbers() {
    $('#reg-time-hour').val('00');
    $('#reg-time-mins').val('00');
    /* 음식 개수 */
    let recipientNumVal = $('input[id^=recipient-num]');
    for (let i = 0; i < recipientNumVal.length; i++) {
        recipientNumVal[i].value = 0;
    }
}
/*음식정보 가져오는 함수 */
function getFoods() {
    $('#foods-group').empty();
    $.ajax({
        type: "GET",
        url: "/foods",
        data: {},
        success: function (response) {
            if (response['result']) {
                let food_list = response['food_list'];
                $.each(food_list, function (index, food_list) {
                    let result = makeFoods(index + 1, food_list);
                    $('#foods-group').append(result);
                });
            }
        }
    });
}


/*음식정보 가져오는 함수 */
function getFoodsForChange(date, hour, mins) {
    let sendDate = date.split('/');

    $('#foods-group').empty();
    $.ajax({
        type: "GET",
        url: "/foods",
        data: {},
        success: function (response) {
            if (response['result']) {
                //음식정보 리스트
                let food_list = response['food_list'];
                let meal_list;
                /* ajax 통신 - 해당 날짜에 맞는 식단정보 갖고오기 */
                $.ajax({
                    type: "GET",
                    url: "/meals/list/time",
                    data: {
                        "year": sendDate[0],
                        "month": sendDate[1],
                        "day": sendDate[2],
                        "hour": hour,
                        "mins": mins
                    },
                    success: function (response) {
                        if (response['result']) {
                            meal_list = response['meal_list'];
                            /* 식단 리스트와 음식 리스트 비교해서 같은게 있으면 value 업데이트 */
                            $.each(food_list, function (outerIndex, food_list) {
                                $.each(meal_list, function (innerIndex, meal_list) {
                                    let result = makeFoods(outerIndex + 1, food_list);
                                    $('#foods-group').append(result);
                                    for (let i = 0; i < meal_list.recipientNames.length; i++) {
                                        if (meal_list.recipientNames[i] == food_list.name) {
                                            $('#recipient-num' + (outerIndex + 1)).val(meal_list.recipientNums[i]);
                                        }
                                    }
                                });
                            });

                        }
                    }
                });
            }
        }
    });
}


function delFood(meal_date, meal_hour, meal_mins) {
    if (confirm('정말로 삭제 하시겠습니까?')) {
        $.ajax({
            type: "DELETE",
            url: "/meals",
            data: {
                "date": meal_date,
                "hour": meal_hour,
                "mins": meal_mins
            },
            success: function (response) {
                alert(response['msg']);
                localStorage.clear();
                reDrawPastMeal(meal_date);
            },
        });
    }
}
/*음식정보 가져오는 함수 */
function getMeals() {
    $.ajax({
        type: "GET",
        url: "/meals/list",
        data: {},
        success: function (response) {
            if (response['result']) {
                let meal_list = response['meal_list'];
                $.each(meal_list, function (index, meal_list) {
                    let recipientNums = meal_list.recipientNums;
                    let make_recipient = "";
                    for (let i = 0; i < recipientNums.length; i++) {
                        make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i] + "개");
                        if (i != recipientNums.length - 1) {
                            make_recipient += ", ";
                        }
                    }
                    let result = makeMeals(index + 1, make_recipient, meal_list);
                    $('#meal_list').append(result);
                });
            } else {
                $.ajax({
                    type: "GET",
                    url: "/meals/date",
                    data: {},
                    success: function (response) {
                        if (response['result']) {
                            let date_list = response['date_list'];

                            let complete_sentence = "";
                            for (let i = 0; i < date_list.length; i++) {
                                let date_sentence = `<option>${date_list[i]}</option>`;
                                complete_sentence += date_sentence;
                            }
                            $('#date_select').html(`                               
                            <select onchange="changeDate(this)">
                                <option value="0">날짜를 선택해주세요.</option>
                                ${complete_sentence}
                            </select>
                            <span class="desc"><-이전에 등록한 식단으로 등록하실 수 있습니다! 날짜를 조회해주세요</span>`);
                        }
                    }
                });
            }
        }
    });
}


function changeDate(obj) {
    let date = obj.value;

    if (date != 0) {
        let dateArray = date.split('/');
        $.ajax({
            type: "GET",
            url: "/meals/list/date",
            data: {
                "year": dateArray[0],
                "month": dateArray[1],
                "day": dateArray[2]
            },
            success: function (response) {
                if (response['result']) {
                    let meal_list = response['meal_list'];
                    $('#meal_list').empty();
                    $.each(meal_list, function (index, meal_list) {
                        let recipientNums = meal_list.recipientNums;
                        let make_recipient = "";
                        for (let i = 0; i < recipientNums.length; i++) {
                            make_recipient += (meal_list.recipientNames[i] + " " + recipientNums[i] + "개");
                            if (i != recipientNums.length - 1) {
                                make_recipient += ", ";
                            }
                        }
                        let result = makeMealsForChange(index + 1, make_recipient, meal_list);
                        $('#meal_list').append(result);
                    });
                    $('#today_meal_reg *').remove();
                    $('#today_meal_reg').append(`<button type="button" id="date-reg-meals" onclick=addMealsByDate('${date}') class="btn btn-warning">${date} 식단으로 등록하기</button>`);
                } else {
                    alert(response['msg']);
                    return;
                }
            }
        });
    } else {
        $('#meal_list').empty();
        $('#today_meal_reg *').remove();
        $('#today_meal_reg').append(`<button type="button" onclick="newAddMeal()" id="reg-meals" class="btn btn-success" data-toggle="modal"
                data-target="#ModalReg">식단등록</button>`);
    }
}
function newAddMeal(){
    getFoods();
}
/* 조회 한 식단으로 오늘의 식단을 등록하는 함수 */
function addMealsByDate(date) {
    if (confirm(date + "의 식단으로 오늘 식단을 등록하시겠습니까?")) {
        $.ajax({
            type: "POST",
            url: "/meals/add",
            data: {
                "date": date
            },
            success: function (response) {
                if (response['result']) {
                    alert(response['msg']);
                    console.log(response);
                    location.reload();
                } else {
                    alert(response['msg']);
                    $('#meal_list').empty();
                }
            },
        });
    }
}
function makeMeals(i, make_recipient, meal_list) {
    let mealHtml = `
                    <tr>
                        <th scope="row">
                            ${i}
                        </th>
                        <td>${make_recipient}</td>
                        <td class="meal_time">${meal_list.hour}:${meal_list.mins}
                        <button type="button" style="margin-left:30px" class="btn btn-primary" id="reg-change-meals" data-toggle="modal" data-target="#ModalReg" onclick="changeFood('${meal_list.date}','${meal_list.hour}','${meal_list.mins}')">변경</button>
                        <button type="button" style="margin-left:30px" class="btn btn-danger" onclick="delFood('${meal_list.date}','${meal_list.hour}','${meal_list.mins}')">삭제</button></td>
                    </tr>`;
    return mealHtml;
}
/* 음식 변경 함수 */
function changeFood(date, hour, mins) {
    getFoodsForChange(date, hour, mins);
    $('#reg-time-hour').val(hour);
    $('#reg-time-mins').val(mins);

    $('#add-meal-btn').hide();
    $('#chg-meal-btn').show();
    $('#chg-date').val(date + ":" + hour + ":" + mins);

}
function chgMeals() {

    /* 음식 개수 */
    let recipientNumVal = $('input[id^=recipient-num]');

    /* 음식 이름 */
    let recipientNameVal = $('label[id^=recipient-name]');

    let recipientNums = new Array();
    let recipientNames = new Array();

    /* 등록된 개수가 모두 0개 인지 체크하는 변수 */
    let zeroFlag = true;
    for (let i = 0; i < recipientNumVal.length; i++) {
        if (recipientNumVal[i].value == '') {
            zeroFlag = true;
            break;
        }
        /* 05개 같은 숫자가 들어올때*/
        if (recipientNumVal[i].value.length == 2) {
            if (recipientNumVal[i].value.charAt(0) == '0') {
                zeroFlag = true;
                break;
            }
        }
        //개수가 1개 이상일 경우에만 insert
        if (recipientNumVal[i].value != '0') {
            recipientNums.push(recipientNumVal[i].value);
            recipientNames.push(recipientNameVal[i].outerText);
            zeroFlag = false;
        }
    }
    if (zeroFlag) {
        alert('등록 할 식단의 개수를 입력해주세요');
        return;
    }

    let hour = $('#reg-time-hour').val();
    let mins = $('#reg-time-mins').val();
    if (hour == '' || mins == '') {
        alert('시간과 분을 정확히 입력해주세요');
        $('#reg-time-hour').val('00');
        $('#reg-time-mins').val('00');
        return;
    }
    // 시간이 1자리로 들어오는 경우 
    if (hour.length == 1) {
        $('#reg-time-hour').val('0' + hour);
        hour = $('#reg-time-hour').val();
    }
    // 분이 1자리로 들어오는 경우
    if (mins.length == 1) {
        $('#reg-time-mins').val('0' + mins);
        mins = $('#reg-time-mins').val();
    }
    $.ajax({
        type: "PUT",
        url: "/meals/change",
        data: {
            "date": $('#chg-date').val(),
            "recipientNums": recipientNums,
            "recipientNames": recipientNames,
            "hour": hour,
            "mins": mins
        },
        success: function (response) {
            if (response['result']) {
                alert(response['msg']);
                $('#ModalReg').modal('hide');
            } else {
                alert(response['msg']);
            }
        },
    });
}
function makeMealsForChange(i, make_recipient, meal_list) {
    let mealHtml = `
                    <tr>
                        <th scope="row">
                            ${i}
                        </th>
                        <td>${make_recipient}</td>
                        <td class="meal_time">${meal_list.hour}:${meal_list.mins}</td>
                    </tr>`;
    return mealHtml;
}

function makeFoods(i, food) {
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
    for (let i = 0; i < recipientNumVal.length; i++) {
        if (recipientNumVal[i].value == '') {
            zeroFlag = true;
            break;
        }
        /* 05개 같은 숫자가 들어올때*/
        if (recipientNumVal[i].value.length == 2) {
            if (recipientNumVal[i].value.charAt(0) == '0') {
                zeroFlag = true;
                break;
            }
        }
        //개수가 1개 이상일 경우에만 insert
        if (recipientNumVal[i].value != '0') {
            recipientNums.push(recipientNumVal[i].value);
            recipientNames.push(recipientNameVal[i].outerText);
            zeroFlag = false;
        }
    }
    if (zeroFlag) {
        alert('등록 할 식단의 개수를 정확히 입력해주세요');
        return;
    }

    let hour = $('#reg-time-hour').val();
    let mins = $('#reg-time-mins').val();
    if (hour == '' || mins == '') {
        alert('시간과 분을 정확히 입력해주세요');
        $('#reg-time-hour').val('00');
        $('#reg-time-mins').val('00');
        return;
    }
    // 시간이 1자리로 들어오는 경우 
    if (hour.length == 1) {
        $('#reg-time-hour').val('0' + hour);
        hour = $('#reg-time-hour').val();
    }
    // 분이 1자리로 들어오는 경우
    if (mins.length == 1) {
        $('#reg-time-mins').val('0' + mins);
        mins = $('#reg-time-mins').val();
    }
    /* 날짜가 있는 경우 */
    if ($('#meal_select').val() !== undefined) {
        $.ajax({
            type: "POST",
            url: "/meals/seldate",
            data: {
                "date":$('#meal_select').val(),
                "recipientNums": recipientNums,
                "recipientNames": recipientNames,
                "hour": hour,
                "mins": mins
            },
            success: function (response) {
                if (response['result']) {
                    alert(response['msg']);
                    $('#ModalReg').modal('hide');
                    reDrawPastMeal($('#meal_select').val());
                } else {
                    alert(response['msg']);
                }
            },
        });
    } else {
        $.ajax({
            type: "POST",
            url: "/meals",
            data: {
                "recipientNums": recipientNums,
                "recipientNames": recipientNames,
                "hour": hour,
                "mins": mins
            },
            success: function (response) {
                if (response['result']) {
                    alert(response['msg']);
                    location.reload();
                } else {
                    alert(response['msg']);
                }
            },
        });
    }
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
    let val = $('#recipient-num' + num).val();

    val = Number(val) + 1;

    if (val > 99) {
        alert('1~99 사이의 숫자를 입력해주세요.');
        val = val - 1;
    }
    $('#recipient-num' + num).val(val);
}

function minusBtn(num) {
    let val = $('#recipient-num' + num).val();

    val = Number(val) - 1;

    if (val < 0) {
        alert('1~99 사이의 숫자를 입력해주세요.');
        val = val + 1;
    }
    $('#recipient-num' + num).val(val);
}

function addExer() {
    let check1 = $('input:checkbox[id="gridCheck1"]').is(":checked");
    let check2 = $('input:checkbox[id="gridCheck2"]').is(":checked");
    let check3 = $('input:checkbox[id="gridCheck3"]').is(":checked");
    let check4 = $('input:checkbox[id="gridCheck4"]').is(":checked");
    let check5 = $('input:checkbox[id="gridCheck5"]').is(":checked");

    if (check1 || check2 || check3 || check4 || check5) {
        var checkArray = new Array(check1, check2, check3, check4, check5);
        $.ajax({
            type: "POST",
            url: "/exercise",
            data: {
                "checkArray": checkArray
            },
            success: function (response) {
                if (response['result']) {
                    alert(response['msg']);
                    location.reload();
                } else {
                    alert('이미 같은 운동이 등록되었습니다.');
                }
            },
        });
    } else {
        alert('오늘 하실 운동을 선택 후 등록해주시기 바랍니다.');
    }

}