# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Csv::File::FileValidator, type: :service do
  describe '#call' do
    subject(:call) { described_class.new(file).call }

    context 'content_typeがtext/csv以外の場合' do
      let(:file) do
        fixture_file_upload('questions.csv', 'text/plain')
      end

      it 'InvalidFileTypeが発生する' do
        expect { call }.to raise_error(Csv::Errors::InvalidFileType, 'CSVファイルのみアップロード可能です')
      end
    end

    context '拡張子が.csv以外の場合' do
      let(:tempfile) do
        Tempfile.new(['questions', '.txt']).tap do |f|
          f.write("問題文\n問題1\n")
          f.rewind
        end
      end
      let(:file) do
        Rack::Test::UploadedFile.new(tempfile.path, 'text/csv', original_filename: 'questions.txt')
      end

      it 'InvalidFileTypeが発生する' do
        expect { call }.to raise_error(Csv::Errors::InvalidFileType)
      end
    end

    context 'ファイルサイズが上限以下の場合' do
      let(:file) { fixture_file_upload('questions.csv', 'text/csv') }

      it '例外が発生しない' do
        expect { call }.not_to raise_error
      end
    end

    context 'ファイルサイズが上限を超える場合' do
      let(:file) do
        tempfile = Tempfile.new(['large', '.csv'])
        tempfile.write("問題文,正解番号\n")
        tempfile.write('a' * (Csv::File::FileValidator::MAX_FILE_SIZE + 1))
        tempfile.rewind

        Rack::Test::UploadedFile.new(tempfile.path, 'text/csv', original_filename: 'large.csv')
      end

      it 'InvalidFileTypeが発生する' do
        expect { call }.to raise_error(Csv::Errors::InvalidFileType, /ファイルサイズ/)
      end
    end
  end
end
