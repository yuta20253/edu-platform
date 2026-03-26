# frozen_string_literal: true

require 'csv'
def normalize_prefecture(name)
  return name if name == '北海道'

  case name
  when '東京'
    '東京都'
  when '大阪', '京都'
    "#{name}府"
  else
    "#{name}県"
  end
end

csv_file_path = Rails.root.join('lib/csv/high_schools/high_school_with_prefecture.csv')

ActiveRecord::Base.transaction do
  CSV.foreach(csv_file_path, headers: true, encoding: 'bom|utf-8') do |row|
    prefecture_name = row['都道府県']
    school_name = row['学校名']

    prefecture = Prefecture.find_by!(name: normalize_prefecture(prefecture_name))
    HighSchool.find_or_create_by!(name: school_name, prefecture: prefecture)
  end
end
