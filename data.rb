require 'sinatra'
require 'json'
require 'data_mapper'

DataMapper.setup(:default, "sqlite3://#{Dir.pwd}/caster.db" )

class Podcasts
    include DataMapper::Resource
    property :slug,         String, key: true, unique_index: true, default: lambda { |resource, prop| resource.title.strip.downcase.gsub " ", "-" }
    property :title,        String, required: true
    property :author,       String
    property :owner,        String
    property :owner,        String
    property :owner_email,  String
    property :category,     String
    property :description,  Text
    property :created_at ,  DateTime  
    property :updated_at ,  DateTime
end

DataMapper.auto_upgrade!

message_podcast = {
    :title => "The Message Podcast",
    :author => "The Message Trust",
    :owner => "The Message Trust",
    :owner_email => "info@message.org.uk",
    :category => "Religion & Spirtuality - Christianity",
    :description => "You just found the podcast from Manchester based youth organisation The Message. Click subscribe to get access to loads of free content including exclusive talks, music and videos. Hold tight!"
}

msg = Podcasts.first_or_create(message_podcast)

# db = Mongo::Connection.new.db('caster')
# podcasts = db.collection('podcasts')
# 
# pod_id = podcasts.update({title: message_podcast[:title]}, message_podcast, {upsert: true})
# 
get '/' do 
	File.read(File.join('public', 'index.html'))
    # @podcasts = Podcasts.all
end

# return all podcasts
get '/podcasts' do 
    content_type :json
    Podcasts.all.to_json
end

# get an individual podcast
get '/podcasts/:slug' do
    Podcasts.get(params[:slug])
end
# 
# # add a new podcast
# post '/podcasts' do
#     podcast = JSON.parse(request.body.read.to_s)
#     oid = podcasts.update({title: podcast['title']}, podcast, {upsert: true})
#     "{\"id\": \"#{oid.to_s}\"}"
# end
# 
# # update podcast
# put '/podcasts/:id' do
#     # puts JSON.parse(request.body.read.to_s).reject{|k,v| k == '_id' || k == 'id'}
#     podcasts.update( {:_id => BSON::ObjectId(params[:id])}, {'$set' => JSON.parse(request.body.read.to_s).reject{|k,v| k == '_id' || k == 'id'}})
# end
