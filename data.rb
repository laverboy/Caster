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
    property :owner_email,  String
    property :copyright,    String
    property :category_id,  String
    property :description,  Text
    property :image,        String
    property :created_at ,  DateTime  
    property :updated_at ,  DateTime
end

DataMapper.auto_upgrade!

check = Podcasts.all

if check.empty?
    message_podcast = {
        :title => "The Message Podcast",
        :author => "The Message Trust",
        :owner => "The Message Trust",
        :owner_email => "info@message.org.uk",
        :category_id => "Religion & Spirtuality - Christianity",
        :description => "You just found the podcast from Manchester based youth organisation The Message. Click subscribe to get access to loads of free content including exclusive talks, music and videos. Hold tight!"
    }
    
    msg = Podcasts.first_or_create(message_podcast)
end


get '/' do 
	# File.read(File.join('public', 'index.html'))
    @podcasts = Podcasts.all.to_json
    
    erb :index
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

# add a new podcast
post '/podcasts' do
    podcast = JSON.parse(request.body.read.to_s)
    newPod = Podcasts.first_or_create(podcast)
    newPod.to_json
end

# update podcast
put '/podcasts' do
    podcast = JSON.parse(request.body.read.to_s)
    # puts JSON.parse(request.body.read.to_s).reject{|k,v| k == '_id' || k == 'id'}
    update = Podcasts.get(podcast['slug'])
    update.update(podcast)
end

#upload image
post "/upload" do
    thumb = params['thumb']
    puts thumb
    File.open('public/uploads/' + thumb[:filename], "w") do |f|
        f.write(thumb[:tempfile].read)
    end
    return "The file was successfully uploaded."
    
    #TODO
    # need to add some serious verification stuff
end
