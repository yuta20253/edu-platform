# frozen_string_literal: true

require 'rails_helper'

# form_classが何のドメインも知らない汎用サービスであることを示すためのテスト用フォーム。
class HeaderValidatorSpecFakeForm
  REQUIRED_HEADERS = %w[name].freeze
end

RSpec.describe Csv::HeaderValidator, type: :service do
  let(:fake_form_class) { HeaderValidatorSpecFakeForm }

  let(:file) do
    Tempfile.new(['rows', '.csv']).tap do |f|
      f.write(csv_content)
      f.rewind
    end
  end

  after { file.close! }

  describe '#call' do
    context '必須列が揃っている場合' do
      let(:csv_content) { "name,unknown\nAlice,x\n" }

      it '何も起きない' do
        expect { described_class.new(file.path, fake_form_class).call }.not_to raise_error
      end
    end

    context '必須列が欠けている場合' do
      let(:csv_content) { "other\nAlice\n" }

      it 'Csv::Errors::InvalidHeaderを投げる' do
        expect { described_class.new(file.path, fake_form_class).call }
          .to raise_error(Csv::Errors::InvalidHeader, 'CSVのフォーマットが不正です')
      end
    end

    context 'ファイルが空の場合' do
      let(:csv_content) { '' }

      it 'Csv::Errors::InvalidHeaderを投げる' do
        expect { described_class.new(file.path, fake_form_class).call }
          .to raise_error(Csv::Errors::InvalidHeader, 'CSVのフォーマットが不正です')
      end
    end

    context '文字コードが異なりCSVとしてパースできない場合(Shift_JIS等)' do
      let(:file) do
        Tempfile.new(['rows', '.csv']).tap do |f|
          f.binmode
          f.write("名前\n".encode('Shift_JIS'))
          f.rewind
        end
      end

      it 'Csv::Errors::InvalidHeaderを投げる（500にせずフォーマット不正として扱う）' do
        expect { described_class.new(file.path, fake_form_class).call }
          .to raise_error(Csv::Errors::InvalidHeader, 'CSVのフォーマットが不正です')
      end
    end
  end
end
