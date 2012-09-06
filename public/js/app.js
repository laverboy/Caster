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
    init: function() {
        
        
        
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
        ":podcast"          : "showPodcast",
        "users"             : "showUsers",
        "login"             : "showLogin"
    },
    home: function () {
        var podcasts = new App.Collection.Podcasts();
        podcasts.fetch();
        RegionManager.show(new App.View.Home({collection: podcasts}));
    },
    showPodcast: function (podcast) {
        var podcasts = new App.Collection.Podcasts();
        podcasts.fetch();
        var model = podcasts.where({slug: podcast});
        RegionManager.show(new App.View.ShowPodcast({model: model[0]}));
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
    url: 'http://webdev:9393/podcasts',
    defaults: {
        'title'         : '',
        'subtitle'      : '',
        'author'        : '',
        'owner_name'    : '',
        'owner_email'   : '',
        'copyright'     : '',
        'description'   : ''
    },
    validate: function (attrs) {
        if (attrs.title === '' || !attrs.title) {
            return "It definitley needs a title!";
        }
    },
    intialize: function () {
        var slug = this.get('title');
        slug = slug.trim().toLowerCase().replace(/\s/g,'-');
        this.set({'slug' : slug});
    }
});
App.Collection.Podcasts = Backbone.Collection.extend({
    model: App.Model.Podcast,
    url: 'http://webdev:9393/podcasts'
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
        this.collection.bind('add', this.addOne, this);
        this.collection.bind('reset', this.addAll, this);
    },
    render: function () {
        this.$el.html(this.template());
        return this;
    },
    addOne: function (podcast) {
        var view = new App.View.PodcastTile({model:podcast});
        this.$('.podcasts').append(view.render().el);
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
        this.$('.wrap').append(form.render().el);
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
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});



App.View.PodcastForm = Backbone.View.extend({
    template: _.template($('#podcastFormTemplate').html()),
    events: {
        'submit #podcastForm'   : 'submit'
    },
    initialize: function () {
        this.model.bind('change:selected', this.closeView, this);
    },
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    submit: function (e) {
        e.preventDefault();
        var formData = this.$('form').serializeArray(), json = {};
        for (var i in formData) {
            json[formData[i].name] = formData[i].value;
        }
        console.log(json);
        
        this.model.save(
            json,
            {error: function (model, response) {
                console.log(model, response);
            }},
            {success: function () {
                this.close();
            }}
        );
    },
    closeView: function () {
        if (!this.model.get('selected')){ this.close();}
    },
    close: function () {
        this.remove();
        this.unbind();
    }
});