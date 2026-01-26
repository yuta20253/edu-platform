english = ['英文法', '英読解']
math = ['I・A', 'Ⅱ・B', 'C']

1.upto(5) do |i|
  Course.find_or_create_by!(subject_id: 1, level_number: i, level_name: english[0])
  Course.find_or_create_by!(subject_id: 1, level_number: i, level_name: english[1])
end

1.upto(5) do |i|
  Course.find_or_create_by!(subject_id: 2, level_number: i, level_name: math[0])
  Course.find_or_create_by!(subject_id: 2, level_number: i, level_name: math[1])
  Course.find_or_create_by!(subject_id: 2, level_number: i, level_name: math[2])
end

1.upto(5) do |i|
  Course.find_or_create_by!(subject_id: 3, level_number: i, level_name: '現代文')
  Course.find_or_create_by!(subject_id: 4, level_number: i, level_name: '古文')
  Course.find_or_create_by!(subject_id: 5, level_number: i, level_name: '日本史')
  Course.find_or_create_by!(subject_id: 6, level_number: i, level_name: '世界史')
  Course.find_or_create_by!(subject_id: 7, level_number: i, level_name: '地理')
  Course.find_or_create_by!(subject_id: 8, level_number: i, level_name: '物理')
  Course.find_or_create_by!(subject_id: 3, level_number: i, level_name: '化学')
  Course.find_or_create_by!(subject_id: 3, level_number: i, level_name: '生物')
  Course.find_or_create_by!(subject_id: 3, level_number: i, level_name: '地学')
end
