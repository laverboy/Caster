/*global Backbone, _ */
/*jshint devel:true */

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
        ""          : "home",
        "users"     : "showUsers",
        "login"     : "showLogin"
    },
    home: function () {
        var podcasts = new App.Collection.Podcasts();
        window.podcasts = podcasts;
        podcasts.fetch();
        RegionManager.show(new App.View.Home({collection: podcasts}));
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

    },
    render: function () {
        this.$el.html(this.template());
        return this;
    },
    showForm: function () {
        var model = this.collection.where({selected: true});
        var form = new App.View.PodcastForm({model: model[0]});
        this.$('.wrap').append(form.render().el);
    },
    showAddForm: function () {
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
    navigate: function () {
        
    }
});

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
    }
});
App.Collection.Podcasts = Backbone.Collection.extend({
    model: App.Model.Podcast,
    url: 'http://webdev:9393/podcasts',
    toggleSelected: function (model) {
        var selectedModels = this.where({selected: true});
        _.each(selectedModels, function(item) {
            item.set('selected',false);
        });
        if (model) { model.set('selected',true); }
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
        
        this.model.save(json);
        this.close();
    },
    closeView: function () {
        if (!this.model.get('selected')){ this.close();}
    },
    close: function () {
        this.remove();
        this.unbind();
    }
});