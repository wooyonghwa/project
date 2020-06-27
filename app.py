import time
import datetime as dt
from flask import Flask, render_template, jsonify, request
app = Flask(__name__)

from pymongo import MongoClient           
client = MongoClient('localhost', 27017)  
db = client.meal #식단 db                      

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/mypage')
def myPage():
    return render_template('mypage.html')

@app.route('/past')
def pastPage():
    return render_template('past.html')

#식단 추가 함수
#시간(연,월,일,시간,분), 음식이름, 개수 저장
@app.route('/meals',methods=['POST'])
def addMeals():
    result = False
    msg = "잠시 후에 다시 시도해주세요."
    recipientNums = request.form.getlist('recipientNums[]')
    recipientNames = request.form.getlist('recipientNames[]')
    hour = request.form['hour']
    mins = request.form['mins']

    # 등록할 식단이 있으면 등록
    if len(recipientNums) > 0:
        #현재 시간을 구해줌
        frmt_date = dt.datetime.now().strftime("%Y/%m/%d")
        #같은 시간 대에 들어간 음식을 찾기
        search_query = {"date":frmt_date, "hour":hour,"mins":mins}
        find_meal = getMeals(search_query)
        
        doc={
                "date":frmt_date,
                "hour":hour,
                "mins":mins,
                "recipientNums":recipientNums,
                "recipientNames":recipientNames
        }
        
        if len(find_meal) > 0:
            #식단 업데이트
            result = updateMeals(doc)
            if result == True:
                msg = "식단이 변경되었습니다."
            else:
                msg = "변경할 식단 내용이 같습니다."
        else:
            insert_result = db.meals.insert_one(doc)
            if insert_result.inserted_id is not None:
                result = True
                msg = "식단이 등록되었습니다."
    return jsonify({'result':result, 'msg': msg})


#식단 추가 함수
# 입력받은 날짜에 해당되는 식단을 오늘 날짜로 모두 저장해줌
# parameter : 입력받은 날짜(연/월/일)
# return value : 식단 추가 성공 여부    
@app.route('/meals/add',methods=['POST'])
def addMealsByDate():
    result = False
    msg = "잠시 후에 다시 시도해주세요."
    # 해당 날짜로 조회하고
    date = request.form['date']
    search_query = {"date":date}
    meal_list = list(db.meals.find(search_query,{'_id':0}))
    # 있으면 그 날짜의 값을 오늘로 바꾸고 다른 값은 그대로 하고 insert
    frmt_date = dt.datetime.now().strftime("%Y/%m/%d")
    if len(meal_list) > 0:
        for meal in meal_list:
            doc ={
                "date":frmt_date,
                "hour":meal['hour'],
                "mins":meal['mins'],
                "recipientNums":meal['recipientNums'],
                "recipientNames":meal['recipientNames']
            }
            insert_result = db.meals.insert_one(doc)
            if insert_result.inserted_id is not None:
                result = True
                msg = "식단이 등록되었습니다."
            else:
                result = False
                break

    return jsonify({'result':result, 'msg': msg})

#식단 추가 함수
# 사용자가 입력한 날짜 (시간(연,월,일,시간,분)), 음식이름, 개수 저장
@app.route('/meals/seldate',methods=['POST'])
def addMealsByInputDate():
    result = False
    msg = "잠시 후에 다시 시도해주세요."
    date = request.form['date']
    recipientNums = request.form.getlist('recipientNums[]')
    recipientNames = request.form.getlist('recipientNames[]')
    hour = request.form['hour']
    mins = request.form['mins']

    # 등록할 식단이 있으면 등록
    if len(recipientNums) > 0:
        
        #같은 시간 대에 들어간 음식을 찾기
        search_query = {"date":date, "hour":hour,"mins":mins}
        find_meal = getMeals(search_query)
        
        doc={
                "date":date,
                "hour":hour,
                "mins":mins,
                "recipientNums":recipientNums,
                "recipientNames":recipientNames
        }
        
        if len(find_meal) > 0:
            #식단 업데이트
            result = updateMeals(doc)
            if result == True:
                msg = "식단이 변경되었습니다."
            else:
                msg = "변경할 식단 내용이 같습니다."
        else:
            insert_result = db.meals.insert_one(doc)
            if insert_result.inserted_id is not None:
                result = True
                msg = "식단이 등록되었습니다."
    return jsonify({'result':result, 'msg': msg})



#식단 변경 함수
# 같은 날, 같은 시간에 등록한 식단이 있으면 새로운 식단으로 업데이트
# parameters : 시간(연,월,일,시간,분), 음식이름, 개수 업데이트
# reurn value : 식단 업데이트 성공여부
@app.route('/meals',methods=['PUT'])
def updateMeals(doc):
    result = False
    if doc is not None:
        myquery = { "date":doc['date'], "hour":doc['hour'],"mins":doc['mins'] }
        newvalues = { "$set": { "recipientNums": doc['recipientNums'], "recipientNames":doc['recipientNames']} }
        update_result = db.meals.update_one(myquery,newvalues)
        if update_result.modified_count > 0:
            result = True
    return result

#식단 변경 함수
# 같은 날, 같은 시간에 등록한 식단이 있으면 새로운 식단으로 업데이트
# parameters : 시간(연,월,일,시간,분), 음식이름, 개수 업데이트
# reurn value : 식단 업데이트 성공여부
@app.route('/meals/change',methods=['PUT'])
def updateMealsInList():
    result = False
    msg = "잠시 후에 다시 시도해주세요."
    updateCheck = False
    date = request.form['date'].split(':')
    hour = request.form['hour']
    mins = request.form['mins']

    #시간은 그대로 두고 변경하려는 경우
    if date[1] == hour and date[2] == mins:
        updateCheck = True
    else:
        search_query = {"date":date[0], "hour":hour,"mins":mins}
        find_meal = getMeals(search_query)

        if len(find_meal) > 0:
            result = False
            msg = '이미 등록된 식단이 있습니다.'
        else:
            updateCheck = True

    if updateCheck == True:
        myquery = { "date":date[0], "hour":date[1],"mins":date[2] }
        newvalues = { "$set": { "hour":hour,"mins":mins,"recipientNums": request.form.getlist('recipientNums[]'), "recipientNames":request.form.getlist('recipientNames[]')} }
        update_result = db.meals.update_one(myquery,newvalues)
        if update_result.modified_count > 0:
            result = True
            msg = '식단이 변경되었습니다.'
        else:
            result = False
            msg = '변경한 내용이 이전에 등록한 식단과 같습니다.'


    return jsonify({'result':result, 'msg': msg})

#식단 삭제 함수
#연월일 시간을 통해 해당 식단을 삭제해줌.
# parameters : 시간(연,월,일,시간,분)
# return value : 식단 삭제여부
@app.route('/meals',methods=['DELETE'])
def delMeals():
    result = False
    msg = "잠시 후에 다시 시도해주세요."

    search_query = {"date":request.form['date'], "hour":request.form['hour'],"mins":request.form['mins']}
    find_meal = getMeals(search_query)
    if len(find_meal) > 0:
        del_result = db.meals.delete_one(search_query)
        if del_result.deleted_count > 0:
            msg = "식단이 삭제되었습니다."
            result = True
        
    return jsonify({'result':result,'msg': msg})
# 식단 조회 함수
# parameters : nothing
# return value : 식단 리스트 전부 리턴해줌, 시간,분으로 오름차순하여
@app.route('/meals',methods=['GET'])
def getMeals():
    result = False
    meal_list = list(db.meals.find({},{'_id':0}).sort([("hour", 1), ("mins", 1)]))
    if len(meal_list) > 0:
        result = True
    return jsonify({'result':result,'meal_list':meal_list})                  

# 식단 조회 함수
# parameters : nothing
# return value : 해당 날짜에 맞는 식단
@app.route('/meals/list',methods=['GET'])
def getMealsByTime():
    result = False
    #현재 시간을 구해줌
    frmt_date = dt.datetime.now().strftime("%Y/%m/%d")
    search_query = {"date":frmt_date}
    meal_list = list(db.meals.find(search_query,{'_id':0}).sort([("hour", 1), ("mins", 1)]))
    if len(meal_list) > 0:
        result = True
    return jsonify({'result':result,'meal_list':meal_list})                  

# 식단 조회 함수
# parameters : 연/월/일
# return value : 해당 날짜에 맞는 식단들
@app.route('/meals/list/date',methods=['GET'])
def getMealsByDates():
    result = False
    #현재 시간을 구해줌
    year = request.args.get('year')
    month = request.args.get('month')
    day = request.args.get('day')

    date=year+'/'+month+'/'+day
    search_query = {"date":date}
    meal_list = list(db.meals.find(search_query,{'_id':0}).sort([("hour", 1), ("mins", 1)]))
    if len(meal_list) > 0:
        result = True
    return jsonify({'result':result,'meal_list':meal_list})

# 식단 조회 함수
# parameters : 연/월/일 시간,분
# return value : 해당 날짜에 맞는 식단들
@app.route('/meals/list/time',methods=['GET'])
def getMealsByDateAndTime():
    result = False
    #현재 시간을 구해줌
    year = request.args.get('year')
    month = request.args.get('month')
    day = request.args.get('day')
    hour = request.args.get('hour')
    mins = request.args.get('mins')

    date=year+'/'+month+'/'+day
    search_query = {"date":date,"hour":hour,"mins":mins}
    meal_list = list(db.meals.find(search_query,{'_id':0}).sort([("hour", 1), ("mins", 1)]))
    if len(meal_list) > 0:
        result = True
    return jsonify({'result':result,'meal_list':meal_list})

# db에 등록된 식단 날짜 리턴 함수
# parameters : nothing
# return value : 해당 날짜에 식단이 등록되어있으면 해당 날짜가 리턴(array로), 2020/06/20, 2020/06/21에 식단이 1개라도 등록되어있으면 두 날짜를 리턴
@app.route('/meals/date',methods=['GET'])
def getDates():
    result = False
    #현재 시간을 구해줌
    date_list = list(db.meals.distinct('date'))
    if len(date_list) > 0:
        result = True
    return jsonify({'result':result,'date_list':date_list})                  

# 식단 조회 함수
# parameters : 시간정보(연,월,일,시간,분)
# return value : 해당 시간에 맞는 식단을 리턴해줌.
def getMeals(doc):
    meal_list = list(db.meals.find(doc))
    return meal_list


# 음식 조회 함수
# 식단에 등록 할 음식을 조회하는 함수
# parameters : nothing
# return value : 음식 리스트 전부 리턴해줌
@app.route('/foods',methods=['GET'])
def getFoods():
    result = False
    food_list = list(db.foods.find({},{'_id':0}))
    if len(food_list) > 0:
        result = True
    return jsonify({'result':result,'food_list':food_list})


#운동 추가 함수
#시간(연,월,일,시간,분), 운동 종류
@app.route('/exercise',methods=['POST'])
def addExercise():
    result = False
    msg = "잠시 후에 다시 시도해주세요."
    #데이터 받기
    checkArray = request.form.getlist('checkArray[]')
    #현재 시간을 구해줌
    frmt_date = dt.datetime.now().strftime("%Y/%m/%d")
    #같은 날에 들어간 운동 찾기
    search_query = {"date":frmt_date}
    find_Exercise = list(db.exercise.find(search_query))
    doc={
        "date":frmt_date
        ,"checkArray":checkArray
    }
    if len(find_Exercise) > 0:
        result = updateExercise(doc)
        if result > 0:
            msg = "오늘의 운동 리스트가 변경되었습니다."
    else:
        insert_result = db.exercise.insert_one(doc)
        if insert_result.inserted_id is not None:
            result = True
            msg = "오늘의 운동이 등록되었습니다."
    return jsonify({'result':result, 'msg': msg})

#운동 변경 함수
# 같은 날 등록한 운동을 새로운 운동 리스트로 업데이트
# parameters : 시간(연,월,일,시간,분)
# reurn value : 운동 업데이트 성공여부
@app.route('/exercise/<doc>',methods=['PUT'])
def updateExercise(doc):
    result = False
    if doc is not None:
        #추후 구현
        if doc == "changeexercise":
            result = db.exercise.update_one({})
        else:
            myquery = { "date":doc['date']}
            newvalues = { "$set": { "checkArray": doc['checkArray']} }
            update_result = db.exercise.update_one(myquery,newvalues)
            return update_result.modified_count
    return jsonify({'result':result, 'msg': '오늘의 운동 리스트가 변경되었습니다.'})

# 운동 조회 함수
# parameters : nothing
# return value : 오늘 등록한 운동 리스트
@app.route('/exercise',methods=['GET'])
def getExercise():
    result = False
    #현재 날짜를 구해줌
    frmt_date = dt.datetime.now().strftime("%Y/%m/%d")
    exercise_list = list(db.exercise.find({"date":frmt_date},{'_id':0}))
    if len(exercise_list) > 0:
        result = True
    return jsonify({'result':result,'exercise_list':exercise_list})                  


# 운동 조회 함수
# parameters : 해당날짜(연/월/일)
# return value : 오늘 등록한 운동 리스트
@app.route('/exercise/list/date',methods=['GET'])
def getExerciseByDate():
    result = False
    #해당 날짜
    date = request.args.get('date')
    exercise_list = list(db.exercise.find({"date":date},{'_id':0}))
    
    if len(exercise_list) > 0:
        result = True
    return jsonify({'result':result,'exercise_list':exercise_list})  

# db에 등록된 운동 날짜 리턴 함수
# parameters : nothing
# return value : 해당 날짜에 운동이 등록되어있으면 해당 날짜가 리턴(array로), 2020/06/20, 2020/06/21에 운동이 1개라도 등록되어있으면 두 날짜를 리턴
@app.route('/exercise/date',methods=['GET'])
def getExerExistsByDates():
    result = False
    #현재 시간을 구해줌
    exer_list = list(db.exercise.distinct('date'))
    if len(exer_list) > 0:
        result = True
    return jsonify({'result':result,'exer_list':exer_list})                  

#운동 삭제하기 추가
# 삭제하기 버튼 클릭 시 해당 운동번호를 False값으로 만들어줌
# parameters : 삭제할 운동의 번호
# return value : 삭제 성공 여부
@app.route('/exercise',methods=['DELETE'])
def delExercise():
    result = False
    msg = "잠시 후에 다시 시도해주세요."

    frmt_date = dt.datetime.now().strftime("%Y/%m/%d")
    search_query = {"date":frmt_date}
    del_result = db.meals.delete_one(search_query)
    if del_result.deleted_count > 0:
            msg = "운동 삭제되었습니다."
            result = True
    return jsonify({'result':result,'msg':msg})





if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)