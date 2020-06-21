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
def MyPage():
    return render_template('mypage.html')


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
            if result > 0:
                msg = "식단이 변경되었습니다."
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
@app.route('/meals/<doc>',methods=['PUT'])
def updateMeals(doc):
    result = False
    if doc is not None:
        #추후 구현
        if doc == "change":
            result = db.meals.update_one({})
        else:
            myquery = { "date":doc['date'], "hour":doc['hour'],"mins":doc['mins'] }
            newvalues = { "$set": { "recipientNums": doc['recipientNums'], "recipientNames":doc['recipientNames']} }
            update_result = db.meals.update_one(myquery,newvalues)
            return update_result.modified_count
    return jsonify({'result':result, 'msg': '식단이 변경되었습니다.'})

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
# parameters : 시간정보(연,월,일,시간,분)
# return value : 해당 시간에 맞는 식단을 리턴해줌.
def getMeals(doc):
    meal_list = list(db.meals.find(doc))
    return meal_list
# 음식 조회 함수
# 식단에 등록 할 음식을 조회하는 함수
# parameters : nothing
# return value : 음식 리스트 전부 리턴해줌
@app.route('/foods')
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
    print(exercise_list)
    if len(exercise_list) > 0:
        result = True
    return jsonify({'result':result,'exercise_list':exercise_list})                  


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)