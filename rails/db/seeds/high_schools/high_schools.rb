require 'csv'

csv_file_path = Rails.root.join('lib', 'csv', 'high_schools', 'high_school_data.csv')

CSV.foreach(csv_file_path, headers: true, encoding: 'CP932:UTF-8') do |row|
  HighSchool.find_or_create_by!(name: row[3])
end
