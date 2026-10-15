"""Extract the project's small CoFID 2021 catalogue. Usage: python extract-foods.py workbook.xlsx.
Requires openpyxl. Values are per 100 g edible portion, with cooked/raw states preserved.
Crown copyright, Open Government Licence v3.0. No inferred micronutrient zeroes.
"""
import json, sys, openpyxl
from pathlib import Path
w=openpyxl.load_workbook(sys.argv[1],read_only=True,data_only=True)
meta=[
('chicken','18-323','Chicken breast','grilled · skinless','chicken',25,350),
('beef','18-071','Sirloin steak','grilled · lean & fat','steak',25,350),
('salmon','16-359','Salmon','baked','fish',25,350),
('mackerel','16-394','Mackerel','grilled','fish',25,300),
('eggs','12-940','Eggs','boiled · 50 g per egg','egg',50,300),
('bread','11-981','Wholemeal bread','about 40 g per slice','bread',40,300),
('rice','11-862','Rice','cooked · unsalted','rice',50,600),
('brown-rice','11-869','Brown rice','cooked · unsalted','rice',50,600),
('potato','13-495','Potatoes','boiled · skin on · unsalted','potato',50,600),
('pasta','11-723','Wholewheat pasta','cooked · unsalted','pasta',50,600),
('oats','11-788','Oats','dry weight','oats',10,150),
('lentils','13-661','Lentils','cooked · unsalted','lentils',50,400),
('broccoli','13-504','Broccoli','steamed','broccoli',50,400),
('carrot','13-497','Carrots','boiled · unsalted','carrot',50,400),
('spinach','13-550','Spinach','cooked · unsalted','leaves',25,300),
('tomato','13-517','Tomatoes','raw','tomato',50,400),
('apple','14-319','Apple','skin on · edible portion','apple',50,400),
('banana','14-318','Banana','peeled','banana',60,360),
('orange','14-327','Orange','peeled','orange',50,400),
('almonds','14-896','Almonds','unsalted','nuts',5,100),
('walnuts','14-879','Walnuts','unsalted','nuts',5,100),
('milk','12-313','Milk','semi-skimmed · grams ≈ ml','milk',50,500),
('yogurt','12-379','Plain yogurt','low fat','yogurt',50,400),
('cheese','12-346','Cheddar','English','cheese',10,100),
('oil','17-038','Olive oil','dressing / cooking oil','oil',5,50),
('cake','11-836','Carrot cake','with icing','cake',20,160),
('chocolate','17-491','Plain chocolate','small dessert','chocolate',10,100),
('salt','17-367','Salt','added seasoning','salt',0.5,5),
# Added templates: keep every existing source record and metadata above unchanged.
('white-bread','11-980','White bread','sliced · about 40 g per slice · UK flour fortification','bread',40,400),
('bun','11-1006','White bun','soft white roll · about 80 g each','bun',20,300),
('burger-patty','19-490','Beef burger patty','98–99% beef · fried in vegetable oil · cooked weight','burger',25,350),
('fries','13-486','Fries','fine cut · fast-food outlet · cooked','fries',25,400),
('pizza','11-936','Cheese & tomato pizza','retail · as eaten','pizza',50,600),
('fried-chicken','18-500','Fried chicken','battered takeaway · edible portion, no bones','fried-chicken',25,400),
('sausage','19-509','Pork sausage','chilled sausage · grilled · cooked weight','sausage',25,250),
('cola','17-175','Cola','regular, with sugar · grams ≈ ml','cola',50,1000),
('tea','17-165','Black tea','brewed · no milk or sugar · grams ≈ ml','tea',50,1000),
]
sheets={name:{r[0]:r for r in list(w[name].values)[3:]} for name in ['1.3 Proximates','1.4 Inorganics','1.5 Vitamins','1.12 (PUFA per 100gFood)']}
def val(x):
 if str(x).strip()=='Tr':return 0
 try:return float(x)
 except:return None
out=[]
for id,code,label,prep,visual,step,maximum in meta:
 p=sheets['1.3 Proximates'][code];m=sheets['1.4 Inorganics'][code];v=sheets['1.5 Vitamins'][code];f=sheets['1.12 (PUFA per 100gFood)'][code]
 nutrients={k:val(r[i]) for k,r,i in [('protein_g',p,9),('fat_g',p,10),('carbohydrate_g',p,11),('fiber_g',p,25),('sodium_mg',m,7),('potassium_mg',m,8),('calcium_mg',m,9),('magnesium_mg',m,10),('iron_mg',m,12),('zinc_mg',m,14),('b12_ug',v,19),('folate_ug',v,20),('c_mg',v,23),('d_ug',v,10),('ala_g',f,16)]}
 epa=val(f[28]) if val(f[28]) is not None else val(f[27]);dha=val(f[40]) if val(f[40]) is not None else val(f[39]);nutrients['epa_dha_mg']=None if epa is None or dha is None else round((epa+dha)*1000,5)
 assert all(nutrients[k] is not None for k in ['protein_g','fat_g','carbohydrate_g']),(id,nutrients)
 out.append(dict(id=id,code=code,name=label,preparation=prep,visual=visual,step=step,max=maximum,sourceName=p[1],sourceKcal=val(p[12]),per100=nutrients))
Path('data/foods.json').write_text(json.dumps({'source':'UK CoFID 2021, Crown copyright, Open Government Licence v3.0','url':'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid','carbohydrateConvention':'monosaccharide equivalents, 3.75 kcal/g; AOAC fibre, 2 kcal/g','foods':out},indent=2)+'\n')
print('Extracted',len(out),'foods')
