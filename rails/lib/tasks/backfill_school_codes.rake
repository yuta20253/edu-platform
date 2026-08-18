# frozen_string_literal: true

namespace :high_schools do
  desc 'school_code が未設定の high_schools に一意なコードを一括採番する（何度実行しても未設定の分のみ処理する）'
  task backfill_school_codes: :environment do
    target = HighSchool.where(school_code: [nil, ''])
    total = target.count

    if total.zero?
      puts 'school_code が未設定の高校はありません（対象0件）。'
      next
    end

    puts "#{total}件の高校に school_code を採番します..."

    updated = 0
    target.find_each do |high_school|
      high_school.update!(school_code: HighSchool.generate_unique_school_code)
      updated += 1
      if (updated % 100).zero? || updated == total
        puts "  [#{updated}/#{total}] #{high_school.name} -> #{high_school.school_code}"
      end
    end

    puts "完了: #{updated}件の school_code を採番しました。"
  end
end
