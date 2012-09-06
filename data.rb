require 'sinatra'
require 'json'
require 'mongo'

db = Mongo::Connection.new.db('caster')
podcasts = db.collection('podcasts')

message_podcast = {
    :title => "The Message Podcast",
    :author => "The Message Trust",
    :owner => "The Message Trust",
    :owner_email => "info@message.org.uk",
    :category => "Religion & Spirtuality - Christianity",
    :description => "You just found the podcast from Manchester based youth organisation The Message. Click subscribe to get access to loads of free content including exclusive talks, music and videos. Hold tight!"
}

pod_id = podcasts.update({title: message_podcast[:title]}, message_podcast, {upsert: true})

get '/' do 
    File.read(File.join('public', 'index.html'))
end

# return all podcasts
get '/podcasts' do 
    content_type :json
    podcasts.find.to_a.map{|i| i.merge({'id' => i['_id'].to_s})}.to_json
end

# add a new podcast
post '/podcasts' do
    podcast = JSON.parse(request.body.read.to_s)
    oid = podcasts.update({title: podcast['title']}, podcast, {upsert: true})
    "{\"id\": \"#{oid.to_s}\"}"
end

# update podcast
put '/podcasts/:id' do
    # puts JSON.parse(request.body.read.to_s).reject{|k,v| k == '_id' || k == 'id'}
    podcasts.update( {:_id => BSON::ObjectId(params[:id])}, {'$set' => JSON.parse(request.body.read.to_s).reject{|k,v| k == '_id' || k == 'id'}})
end

# get an individual podcast
get '/podcast/:slug' do
    podcasts.find_one
end