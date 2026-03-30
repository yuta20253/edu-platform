# frozen_string_literal: true

require 'csv'

csv_file_path = Rails.root.join('lib/csv/addresses/address.csv')

prefectures = Prefecture.all.index_by(&:name)

records = []

ActiveRecord::Base.transaction do
  CSV.foreach(csv_file_path, headers: true, encoding: 'bom|utf-8').with_index(2) do |row, i|
    postal_code = row['郵便番号']
    prefecture_name = row['都道府県']
    city_name = row['市区町村']
    town = row['町名']

    raise "[ERROR] line=#{i} prefecture is blank: #{row.to_h}" if prefecture_name.blank?

    next if town == '以下に掲載がない場合'

    prefecture = prefectures[prefecture_name]

    unless prefecture
      raise "[ERROR] line=#{i} Prefecture not found: #{prefecture_name} / #{row.to_h}"
      next
    end

    records << {
      postal_code: postal_code,
      prefecture_id: prefecture.id,
      city: city_name,
      town: town
    }
  end
  Address.insert_all(records)
end
