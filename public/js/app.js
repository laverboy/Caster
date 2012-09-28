/*global Backbone, _ */
/*jshint devel:true */
/*jshint bitwise:false */

/* -------------------------------------- */
/*           View Helper                  */
/* -------------------------------------- */

var RegionManager = (function (Backbone, $) {
    var currentView;
    var el = "#container";
    var region = {};

    var closeView = function (view) {
        if (view && view.close) {
            view.close();
        }
    };

    var openView = function (view) {
        view.render();
        view.$el.addClass('animated fadeIn');
        $(el).html(view.el);
    };

    region.show = function (view) {
        closeView(currentView);
        currentView = view;
        openView(currentView);
    };

    return region;
})(Backbone, jQuery);

/* -------------------------------------- */
/*           Containing Function          */
/* -------------------------------------- */

var App = {
    View: {},
    Collection: {},
    Model: {},
    init: function(initialCollection) {
		
		this.podcasts = new App.Collection.Podcasts();
		this.podcasts.reset(initialCollection);
		
		var appRoutes;
        appRoutes = new App.Routes();
        
        Backbone.history.start();
        
    }
};

/* -------------------------------------- */
/*           Router                       */
/* -------------------------------------- */

App.Routes = Backbone.Router.extend({
    routes: {
        ""                  : "home",
        ":slug"             : "showPodcast",
        "users"             : "showUsers",
        "login"             : "showLogin"
    },
    home: function () {
        RegionManager.show(new App.View.Home({collection: App.podcasts}));
        App.podcasts.trigger('reset');
    },
    showPodcast: function (slug) {
        RegionManager.show(new App.View.ShowPodcast({model: App.podcasts.get(slug)}));
    },
    showUsers: function () {
        var items = new App.Collection.Items();
        items.fetch({data: {name: 'news', url: 'http://www.message.org.uk/category/news/feed/'}});
        RegionManager.show(new App.View.Items({collection: items, title: "News"}));
    },
    showLogin: function () {
        var items = new App.Collection.Items();
        items.fetch({data: {name: 'flow', url: 'http://podcast.message.org.uk/feed/flowpodcast'}});
        RegionManager.show(new App.View.Items({collection: items, title: "Flow", type: "podcast"}));
    }
});

/* -------------------------------------- */
/*           Models 'n' Stuff             */
/* -------------------------------------- */

App.Model.Podcast = Backbone.Model.extend({
    url: '/podcasts',
    idAttribute: "slug",
    defaults: {
        'title'         : '',
        'author'        : '',
        'owner'         : '',
        'owner_email'   : '',
        'copyright'     : '',
        'description'   : ''
    },
    validate: function (attrs) {
        if (attrs.title === '' || !attrs.title) {
            return "It definitley needs a title!";
        }
    }
});
App.Collection.Podcasts = Backbone.Collection.extend({
    model: App.Model.Podcast,
    url: '/podcasts'
});

App.Model.Entry = Backbone.Model.extend({});
App.Collection.Entries = Backbone.Collection.extend({
    model: App.Model.Entry,
    url: '/entries'
});

/* -------------------------------------- */
/*           Home                         */
/* -------------------------------------- */

App.View.Home = Backbone.View.extend({
    tagName: 'section',
    id: 'home',
    template: _.template($('#homeTemplate').html()),
    events: {
        "click .editPod"    : "showForm",
        'click .addPod'     : 'showAddForm'
    },
    initialize: function () {
        _.bindAll(this, 'addOne', 'addAll');
        this.collection.bind('add', this.addOne, this);
        this.collection.bind('reset', this.addAll, this);
        
    },
    render: function () {
        this.$el.html(this.template());
        return this;
    },
    addOne: function (podcast) {
        var view = new App.View.PodcastTile({model:podcast});
        this.$('.podcasts').prepend(view.render().el);
    },
    addAll: function () {
        this.collection.each(this.addOne);
    },
    showForm: function () {
        var model = this.collection.where({selected: true});
        var form = new App.View.PodcastForm({model: model[0]});
        this.$('.wrap').append(form.render().el);
    },
    showAddForm: function (e) {
        e.preventDefault();
        var model = new App.Model.Podcast();
        var form = new App.View.PodcastForm({model: model});
        this.$el.prepend(form.render().el);
    },
    close: function(){
        this.remove();
        this.unbind();
    }
});

App.View.PodcastTile = Backbone.View.extend({
    className: 'podcastTile',
    template: _.template($('#podcastTileTemplate').html()),
    events: {
        'click .thumb'  : 'navigate'
    },
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    navigate: function (e) {
        e.preventDefault();
        var url = this.model.get('slug');
        Backbone.history.navigate(url, {trigger: true});
    }
});

/* -------------------------------------- */
/*           Show Podcast                 */
/* -------------------------------------- */

App.View.ShowPodcast = Backbone.View.extend({
    tagName: 'section',
    id: 'showPodcast',
    template: _.template($('#showPodcastTemplate').html()),
    events: {
        'click .editPod' : 'showEditForm',
        'drop #podDrop'  : 'dropHandler',
        'dragenter'      : 'dragHandler',
        'dragleave'      : 'dragHandler'
    },
    initialize: function () {
        _.bindAll(this, 'loadEntries', 'dropHandler', 'dragHandler');
        /* TODO need to add auto updating of view on save */
        
        /* Get entries for this podcast */
        var entries = new App.Collection.Entries();
        entries.fetch(
            {
                data: {slug: this.model.get('slug')},
                success: this.loadEntries
            }
        );
    },
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    showEditForm: function (e) {
        e.preventDefault();
        var form = new App.View.PodcastForm({model: this.model});
        this.$el.prepend(form.render().el);
    },
    loadEntries: function(collection) {
        /* TODO if collection empty */
        collection.each(this.addEntry);
    },
    addEntry: function (model) {
        var entry = new App.View.Entry({model: model});
        this.$('#entries tbody').append(entry.render().el);
    },
    dragHandler: function (event) {
        /* stop any default actions */
        event.stopPropagation();
        event.preventDefault();

        this.$('#podDrop').toggleClass('dragging');
    },
    dropHandler: function (event) {
        /* stop any default actions */
        event.stopPropagation();
        event.preventDefault();
        
        this.$('#podDrop').removeClass('dragging');
        
        var allowedFiles = {"audio/x-m4a" : true, "audio/mp3" : true};
        
        var e = event.originalEvent;
        e.dataTransfer.dropEffect = 'copy';

        var audioFile = e.dataTransfer.files[0];
        console.log(audioFile);
                
        if (allowedFiles[audioFile.type] !== true){
            console.log('not an audio file we like');
        }
        
        if (audioFile.size > 50000000) {
            /* throw some kind of too big error */
            console.log('bigger than 50mb');
        }
        
        var newEntry = new App.Model.Entry({
            file: audioFile,
            title: audioFile.name.split('.').shift(),
            fileName: audioFile.name,
            fileSize: (audioFile.size/1000000).toFixed(2) + 'mb'
        });
        var newEntryForm = new App.View.EntryForm({model: newEntry});
        this.$('#podDrop').append(newEntryForm.render().el);
        
    },
    close: function(){
        this.remove();
        this.unbind();
    }
});

App.View.Entry = Backbone.View.extend({
    tagName: 'tr',
    className: 'entry',
    template: _.template($('#entryTemplate').html()),
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});

App.View.EntryForm = Backbone.View.extend({
    tagName: 'form',
    className: 'entryForm',
    template: _.template($('#entryFormTemplate').html()),
    events: {
        'submit'    : 'submit'
    },
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    submit: function (e) {
        e.preventDefault();
        
        var formData = new FormData();
        formData.append('file', this.model.get('file'));
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/entries');
        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log('all done: ' + xhr.status);
            } else {
                console.log('Something went horribly wrong...');
            }
        };
        var progress = this.$('#progress')[0];
        xhr.upload.onprogress = function (event) {
            
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);
                progress.value = progress.innerHTML = complete;
            }
        };
        xhr.onload = function () {
          // just in case we get stuck around 99%
          progress.value = progress.innerHTML = 100;
        };
        
        xhr.send(formData);
    }
});



App.View.PodcastForm = Backbone.View.extend({
    className: 'topSlide',
    template: _.template($('#podcastFormTemplate').html()),
    events: {
        'submit #podcastForm'   : 'submit',
        'drop #picture'         : 'dropHandler',
        'click .close'          : 'close'
    },
    initialize: function () {
        _.bindAll(this, 'submit', 'dropHandler');
    },
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    submit: function (e) {
        e.preventDefault();
        var self = this;
        var formData = this.$('form').serializeArray(), json = {};
        for (var i in formData) {
            json[formData[i].name] = formData[i].value;
        }
        
        if (this.model.isNew()) {

            App.podcasts.create(
                json,
                {
                    success: function (model, response) {
                        console.log("success: ", model, response);
                        self.close();
                    },
                    error: function (model, response) {
                        console.log("error: ", model, response);
                    },
                    wait:true
                }
            );
            
        } else {
            this.model.save(
                json,
                {
                    success: function (model, response) {
                        console.log("success: ", model, response);
                        self.close();
                    },
                    error: function (model, response) {
                        console.log("error: ", model, response);
                    },
                    wait:true
                }
            );
        }
    },
    dropHandler: function (event) {
        /* stop any default actions */
        event.stopPropagation();
        event.preventDefault();
        
        var self = this;
        
        var e = event.originalEvent;
        e.dataTransfer.dropEffect = 'copy';

        var pictureFile = e.dataTransfer.files[0];
        if (pictureFile.size > 500000) {
            /* throw some kind of too big error */
            console.log('bigger than 500k');
        }
        
        /* Show the new picture immediately */
        var reader = new FileReader();
        reader.onloadend = function () {
            self.$('#picture').attr('src', reader.result);
        };
        reader.readAsDataURL(pictureFile);
        
        /* upload the picture and set the name to the model */
        var data = new FormData();
        data.append('thumb', pictureFile);
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: data,
            processData: false,
            cache: false,
            contentType: false
        })
        .done(function (resp) {
            console.log("uploaded: ", resp);
            self.model.set('image', pictureFile.name);
        })
        .fail(function (resp) {
            console.log("fail: ", resp);
        });
    },
    close: function () {
        this.remove();
        this.unbind();
    }
});